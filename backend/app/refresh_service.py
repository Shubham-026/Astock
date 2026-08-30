"""
Background quote refresher.

The previous approach fetched all curated tickers on-demand whenever
/api/companies was hit, via yf.download(..., threads=True). That turned
out to be a mistake: yf.download does NOT send one combined request for
many tickers - it fires one HTTP request per ticker, just concurrently.
Doing that on every request created a burst of ~40 near-simultaneous
requests to Yahoo, which is exactly the pattern that trips a burst-based
rate limiter (and once tripped, takes out every request still in flight -
which is why everything past a certain point in the list started failing
together).

This module instead keeps quotes warm on a slow, steady background
schedule, decoupled from user traffic entirely:
  - fetch one ticker, wait a bit, fetch the next, ...
  - after the whole list is done, wait a longer cooldown, then repeat

/api/companies and /api/companies/search then just read whatever is
already in the (no-expiry) quote store - fast, and Yahoo only ever sees
a slow trickle of requests instead of a burst tied to page loads.
"""
import logging
import threading
import time

from app.companies_data import COMPANIES
from app import yf_service

logger = logging.getLogger("refresh_service")

# Time between individual ticker fetches within one refresh pass.
PER_TICKER_DELAY_SECONDS = 0.35
# Time to wait after finishing a full pass before starting the next one.
COOLDOWN_SECONDS = 60

_stop_event = threading.Event()
_thread = None


def _refresh_loop():
    tickers = [c["ticker"] for c in COMPANIES]
    logger.info(
        "Quote refresher starting: %d tickers, ~%.1fs apart, %ds cooldown between passes",
        len(tickers),
        PER_TICKER_DELAY_SECONDS,
        COOLDOWN_SECONDS,
    )
    while not _stop_event.is_set():
        for ticker in tickers:
            if _stop_event.is_set():
                break
            try:
                yf_service.get_quote(ticker)  # populates the persistent quote store
            except Exception as exc:  # noqa: BLE001
                logger.warning("Background refresh failed for %s: %s", ticker, exc)
            _stop_event.wait(PER_TICKER_DELAY_SECONDS)
        _stop_event.wait(COOLDOWN_SECONDS)


def start():
    global _thread
    if _thread is not None:
        return
    _thread = threading.Thread(target=_refresh_loop, daemon=True, name="quote-refresher")
    _thread.start()


def stop():
    _stop_event.set()
