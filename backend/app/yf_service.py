"""
Data access layer for prices/quotes/history.

Primary source is yfinance (Yahoo Finance). Because yfinance is an
*unofficial* scraper (not a real API), Yahoo will rate-limit or
temporarily block a client that makes too many requests in a short
window - and once that happens, no amount of client-side retrying fixes
it; the block can last minutes to hours regardless of code changes.

To keep the app usable through that, this module:
  1. Maintains a no-expiry "latest quote" store that a slow, steadily
     paced background job (app/refresh_service.py) keeps warm - so
     listing many tickers is a fast local read, not a burst of live
     requests (bursts are exactly what trips Yahoo's rate limiter).
  2. Retries transient errors with backoff.
  3. Falls back to Stooq (a completely separate, unauthenticated data
     source) for price history if Yahoo is blocking.
  4. Falls back to the last successfully-fetched data for a ticker
     (however old) if BOTH providers fail, so the app degrades to
     "slightly stale" instead of "broken".
"""
import io
import logging
import random
import threading
import time

import pandas as pd
import requests
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

# Roughly how many trading days each yfinance-style period string covers.
# Used to slice the Stooq fallback (which we fetch as one long series).
_PERIOD_TRADING_DAYS = {
    "5d": 5,
    "3mo": 65,
    "6mo": 130,
    "1y": 260,
    "2y": 520,
}

_lock = threading.Lock()
_quote_cache = TTLCache(maxsize=512, ttl=QUOTE_CACHE_TTL)
_chart_cache = TTLCache(maxsize=512, ttl=CHART_CACHE_TTL)
_profile_cache = TTLCache(maxsize=512, ttl=PROFILE_CACHE_TTL)
_history_cache = TTLCache(maxsize=512, ttl=RISK_CACHE_TTL)

# No-TTL "last known good" store. Updated whenever ANY provider succeeds;
# read only as a last resort when everything else fails, so the app can
# serve slightly-stale data instead of erroring during a Yahoo block.
_stale_history_store = {}

# No-TTL "latest quote" store, keyed by ticker. This is what the
# background refresher (app/refresh_service.py) writes to, and what
# get_quotes_for_list() reads from directly - so listing many companies
# never itself triggers a burst of live requests; it's just a fast
# in-memory read, and freshness is managed entirely by the slow,
# steadily-paced background loop.
_latest_quote_store = {}

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
    """Raised when no provider has usable data for a symbol."""


def _is_transient(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(marker in msg for marker in _TRANSIENT_MARKERS)


def _with_retry(fn, *args, max_retries=2, base_delay=1.5, **kwargs):
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
    raise last_exc  # pragma: no cover


def _cached(cache: TTLCache, key):
    with _lock:
        return cache.get(key)


def _store(cache: TTLCache, key, value):
    with _lock:
        cache[key] = value
    return value


def _store_stale(key, value):
    with _lock:
        _stale_history_store[key] = value


def _get_stale(key):
    with _lock:
        return _stale_history_store.get(key)


def _store_latest_quote(ticker: str, quote: dict):
    with _lock:
        _latest_quote_store[ticker.upper()] = quote


def _get_latest_quote(ticker: str):
    with _lock:
        return _latest_quote_store.get(ticker.upper())


# --------------------------------------------------------------------------
# Stooq fallback - a separate, unauthenticated data source used only when
# yfinance itself is failing (e.g. Yahoo rate limit). US tickers only.
# --------------------------------------------------------------------------
def _fetch_stooq_history(ticker: str) -> pd.DataFrame:
    symbol = f"{ticker.lower()}.us"
    url = f"https://stooq.com/q/d/l/?s={symbol}&i=d"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    text = resp.text
    if not text or "Date,Open" not in text:
        raise TickerNotFoundError(ticker)

    df = pd.read_csv(io.StringIO(text), parse_dates=["Date"])
    if df.empty or "Close" not in df.columns:
        raise TickerNotFoundError(ticker)

    df = df.set_index("Date").sort_index()
    return df


def _history_from_stooq(ticker: str, period: str) -> pd.DataFrame:
    days = _PERIOD_TRADING_DAYS.get(period, 260)
    full = _fetch_stooq_history(ticker)
    sliced = full.tail(days)
    if sliced.empty:
        raise TickerNotFoundError(ticker)
    return sliced


def _get_history(ticker: str, period: str) -> pd.DataFrame:
    key = (ticker.upper(), period)
    hit = _cached(_history_cache, key)
    if hit is not None:
        return hit

    # 1) Try Yahoo via yfinance.
    try:
        hist = _with_retry(lambda: yf.Ticker(ticker).history(period=period, auto_adjust=False))
        if hist is not None and not hist.empty:
            _store(_history_cache, key, hist)
            _store_stale(key, hist)
            return hist
    except Exception as exc:  # noqa: BLE001
        logger.warning("yfinance history() failed for %s (%s): %s", ticker, period, exc)

    # 2) Yahoo failed - try Stooq as an independent fallback source.
    try:
        hist = _history_from_stooq(ticker, period)
        logger.info("Serving %s (%s) from Stooq fallback (Yahoo unavailable)", ticker, period)
        _store(_history_cache, key, hist)
        _store_stale(key, hist)
        return hist
    except Exception as exc:  # noqa: BLE001
        logger.warning("Stooq fallback also failed for %s (%s): %s", ticker, period, exc)

    # 3) Both providers failed - serve the last known-good data if we have
    # any, however old, rather than erroring out entirely.
    stale = _get_stale(key)
    if stale is not None:
        logger.warning("Serving STALE cached data for %s (%s) - both providers are down", ticker, period)
        return stale

    raise TickerNotFoundError(ticker)


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

    quote = {"price": round(price, 2), "change": round(change, 2)}
    _store(_quote_cache, key, quote)
    _store_latest_quote(key, quote)  # feeds get_quotes_for_list()
    return quote


def get_quotes_for_list(tickers: list) -> dict:
    """
    Fast, request-time read of { TICKER: {price, change} } for many
    tickers, sourced from the no-expiry store the background refresher
    (app/refresh_service.py) keeps warm on a slow, steady schedule.

    This deliberately does NOT fetch live data for the whole list on the
    request path: doing that (even via yf.download, which still issues
    one HTTP request per ticker under the hood, just concurrently) sends
    a burst of near-simultaneous requests to Yahoo - exactly the pattern
    that trips its rate limiter. Only tickers the background job hasn't
    fetched yet (e.g. right after a cold start) get a synchronous,
    slightly-paced fetch here as a one-time fallback.
    """
    results = {}
    missing = []
    for t in tickers:
        quote = _get_latest_quote(t)
        if quote is not None:
            results[t.upper()] = quote
        else:
            missing.append(t)

    for t in missing:
        try:
            results[t.upper()] = get_quote(t)
        except TickerNotFoundError:
            continue
        time.sleep(0.15)  # cold-start only; keeps this rare path gentle too

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
    """
    { name, sector, summary, marketCapB } sourced from yfinance's info
    payload. This hits a heavier/more rate-limited Yahoo endpoint than
    price history, so failures here degrade gracefully (generic summary,
    null market cap) rather than raising - callers still get a usable
    company detail response even if this specific call is blocked.
    """
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
        degraded = {
            "name": ticker.upper(),
            "sector": "Diversified",
            "summary": "Company summary is temporarily unavailable.",
            "marketCapB": None,
        }
        return degraded  # not cached - so we retry properly once Yahoo recovers

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
