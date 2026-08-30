"""
Thin wrapper around yfinance with:
  - a small TTL cache (yfinance scrapes Yahoo Finance under the hood and
    will start failing/slowing down if hammered)
  - a bulk-quote path so listing many tickers costs ONE request instead
    of one-per-ticker (the single biggest cause of 429s / the
    "Expecting value: line 1 column 1" JSON errors you'll see if Yahoo
    throttles or briefly blocks you)
  - retry-with-backoff for transient rate-limit errors
  - normalization into the plain dict shapes the routes need
  - consistent errors (raises TickerNotFoundError) for bad tickers
"""
import logging
import random
import threading
import time

import pandas as pd
import yfinance as yf
from cachetools import TTLCache

from app.config import (
    CHART_CACHE_TTL,
    PROFILE_CACHE_TTL,
    QUOTE_CACHE_TTL,
    RISK_CACHE_TTL,
)

logger = logging.getLogger("yf_service")

RANGE_TO_PERIOD = {
    30: "3mo",
    90: "6mo",
    180: "1y",
    365: "2y",
}

# Risk metrics need at least ~3mo of history for a stable 20-day MA/volume
# baseline, regardless of the chart range being requested elsewhere.
RISK_HISTORY_PERIOD = "6mo"

_lock = threading.Lock()
_quote_cache = TTLCache(maxsize=512, ttl=QUOTE_CACHE_TTL)
_chart_cache = TTLCache(maxsize=512, ttl=CHART_CACHE_TTL)
_profile_cache = TTLCache(maxsize=512, ttl=PROFILE_CACHE_TTL)
_history_cache = TTLCache(maxsize=512, ttl=RISK_CACHE_TTL)

# Words/phrases that show up in yfinance's various flavors of "Yahoo
# throttled or briefly blocked us" errors. Worth a retry; most other
# errors (bad ticker, genuinely delisted) are not.
_TRANSIENT_MARKERS = (
    "rate limit",
    "too many requests",
    "429",
    "expecting value",
)


class TickerNotFoundError(Exception):
    """Raised when yfinance has no usable data for a symbol."""


def _is_transient(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(marker in msg for marker in _TRANSIENT_MARKERS)


def _with_retry(fn, *args, max_retries=3, base_delay=1.5, **kwargs):
    """Retry fn() with exponential backoff + jitter on transient Yahoo errors."""
    last_exc = None
    for attempt in range(max_retries):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if not _is_transient(exc) or attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 0.5)
            logger.warning(
                "Transient Yahoo error (attempt %d/%d), retrying in %.1fs: %s",
                attempt + 1,
                max_retries,
                delay,
                exc,
            )
            time.sleep(delay)
    raise last_exc  # pragma: no cover - unreachable, satisfies linters


def _cached(cache: TTLCache, key):
    with _lock:
        return cache.get(key)


def _store(cache: TTLCache, key, value):
    with _lock:
        cache[key] = value
    return value


def _get_history(ticker: str, period: str) -> pd.DataFrame:
    key = (ticker.upper(), period)
    hit = _cached(_history_cache, key)
    if hit is not None:
        return hit

    try:
        hist = _with_retry(lambda: yf.Ticker(ticker).history(period=period, auto_adjust=False))
    except Exception as exc:  # noqa: BLE001 - yfinance raises assorted network/parsing errors
        logger.warning("yfinance history() failed for %s: %s", ticker, exc)
        raise TickerNotFoundError(ticker) from exc

    if hist is None or hist.empty:
        raise TickerNotFoundError(ticker)

    return _store(_history_cache, key, hist)


def get_quote(ticker: str) -> dict:
    """{ price, change } - change is percent change vs previous close."""
    key = ticker.upper()
    hit = _cached(_quote_cache, key)
    if hit is not None:
        return hit

    hist = _get_history(ticker, "5d")
    closes = hist["Close"].dropna()
    if len(closes) < 1:
        raise TickerNotFoundError(ticker)

    price = float(closes.iloc[-1])
    prev_close = float(closes.iloc[-2]) if len(closes) >= 2 else price
    change = ((price - prev_close) / prev_close) * 100 if prev_close else 0.0

    return _store(_quote_cache, key, {"price": round(price, 2), "change": round(change, 2)})


def get_quotes_bulk(tickers: list) -> dict:
    """
    Fetch { TICKER: {price, change} } for many tickers at once.

    This is what /api/companies and /api/companies/search should use
    instead of calling get_quote() in a loop: yf.download() fetches every
    symbol in ONE request instead of one request per ticker, which is by
    far the most effective way to avoid Yahoo's rate limiting on a page
    that lists dozens of companies.
    """
    results = {}
    uncached = []
    for t in tickers:
        key = t.upper()
        hit = _cached(_quote_cache, key)
        if hit is not None:
            results[key] = hit
        else:
            uncached.append(key)

    if not uncached:
        return results

    try:
        data = _with_retry(
            lambda: yf.download(
                uncached,
                period="5d",
                group_by="ticker",
                auto_adjust=False,
                threads=True,
                progress=False,
            )
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Bulk quote download failed (%s), falling back to per-ticker fetches", exc)
        data = None

    if data is not None and not data.empty:
        for t in uncached:
            try:
                closes = (data[t]["Close"] if len(uncached) > 1 else data["Close"]).dropna()
                if closes.empty:
                    continue
                price = float(closes.iloc[-1])
                prev_close = float(closes.iloc[-2]) if len(closes) >= 2 else price
                change = ((price - prev_close) / prev_close) * 100 if prev_close else 0.0
                results[t] = _store(
                    _quote_cache, t, {"price": round(price, 2), "change": round(change, 2)}
                )
            except (KeyError, IndexError):
                continue  # this ticker just wasn't in the bulk response; fall back below

    # Anything the bulk call didn't return (partial failures, single bad
    # ticker in the batch, etc.) gets a normal per-ticker retry, with a
    # small stagger so we don't immediately re-trigger the same limit.
    for t in uncached:
        if t in results:
            continue
        try:
            results[t] = get_quote(t)
        except TickerNotFoundError:
            continue
        time.sleep(0.15)

    return results


def get_chart(ticker: str, range_days: int) -> list:
    """Closing prices over the requested range, oldest first."""
    period = RANGE_TO_PERIOD.get(range_days)
    if period is None:
        raise ValueError(f"Unsupported range: {range_days}")

    key = (ticker.upper(), range_days)
    hit = _cached(_chart_cache, key)
    if hit is not None:
        return hit

    hist = _get_history(ticker, period)
    prices = [round(float(p), 2) for p in hist["Close"].dropna().tolist()]
    return _store(_chart_cache, key, prices)


def get_profile(ticker: str) -> dict:
    """{ name, sector, summary, marketCapB } sourced from yfinance's info payload."""
    key = ticker.upper()
    hit = _cached(_profile_cache, key)
    if hit is not None:
        return hit

    try:
        info = _with_retry(lambda: yf.Ticker(ticker).get_info())
    except Exception as exc:  # noqa: BLE001
        logger.warning("yfinance get_info() failed for %s: %s", ticker, exc)
        info = {}

    if not info:
        raise TickerNotFoundError(ticker)

    market_cap = info.get("marketCap")
    profile = {
        "name": info.get("longName") or info.get("shortName") or ticker.upper(),
        "sector": info.get("sector") or "Diversified",
        "summary": info.get("longBusinessSummary") or "No company summary available.",
        "marketCapB": round(market_cap / 1e9, 2) if market_cap else None,
    }
    return _store(_profile_cache, key, profile)


def get_risk_history(ticker: str) -> pd.DataFrame:
    """History window used for feature engineering + 52wk stats."""
    return _get_history(ticker, RISK_HISTORY_PERIOD)


def get_52w_range(ticker: str) -> dict:
    hist = _get_history(ticker, "1y")
    closes = hist["Close"].dropna()
    return {"low52": round(float(closes.min()), 2), "high52": round(float(closes.max()), 2)}


def get_avg_volume_m(ticker: str) -> float:
    hist = _get_history(ticker, "3mo")
    volumes = hist["Volume"].dropna()
    if volumes.empty:
        return 0.0
    return round(float(volumes.mean()) / 1e6, 2)
