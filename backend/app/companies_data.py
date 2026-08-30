"""
yfinance has no "list all companies" endpoint, so we keep a small curated
universe of well-known tickers here. This drives:

  - GET /api/companies            (the default browsable list)
  - GET /api/companies/search?q=  (filtered against this list first)

Any *individual* ticker endpoint (/api/companies/:ticker, /quote, /chart,
/risk) works for ANY valid ticker, not just the ones below - if a ticker
isn't in this table we just fall back to whatever yfinance reports for
name/sector.

Feel free to extend this list; it's just metadata (no network calls).
"""

COMPANIES = [
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Technology"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology"},
    {"ticker": "AMZN", "name": "Amazon.com, Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology"},
    {"ticker": "META", "name": "Meta Platforms, Inc.", "sector": "Technology"},
    {"ticker": "TSLA", "name": "Tesla, Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "BRK-B", "name": "Berkshire Hathaway Inc.", "sector": "Financial Services"},
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financial Services"},
    {"ticker": "V", "name": "Visa Inc.", "sector": "Financial Services"},
    {"ticker": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare"},
    {"ticker": "UNH", "name": "UnitedHealth Group Incorporated", "sector": "Healthcare"},
    {"ticker": "XOM", "name": "Exxon Mobil Corporation", "sector": "Energy"},
    {"ticker": "CVX", "name": "Chevron Corporation", "sector": "Energy"},
    {"ticker": "PG", "name": "The Procter & Gamble Company", "sector": "Consumer Defensive"},
    {"ticker": "KO", "name": "The Coca-Cola Company", "sector": "Consumer Defensive"},
    {"ticker": "PEP", "name": "PepsiCo, Inc.", "sector": "Consumer Defensive"},
    {"ticker": "WMT", "name": "Walmart Inc.", "sector": "Consumer Defensive"},
    {"ticker": "HD", "name": "The Home Depot, Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "DIS", "name": "The Walt Disney Company", "sector": "Communication Services"},
    {"ticker": "NFLX", "name": "Netflix, Inc.", "sector": "Communication Services"},
    {"ticker": "ADBE", "name": "Adobe Inc.", "sector": "Technology"},
    {"ticker": "CRM", "name": "Salesforce, Inc.", "sector": "Technology"},
    {"ticker": "INTC", "name": "Intel Corporation", "sector": "Technology"},
    {"ticker": "AMD", "name": "Advanced Micro Devices, Inc.", "sector": "Technology"},
    {"ticker": "PYPL", "name": "PayPal Holdings, Inc.", "sector": "Financial Services"},
    {"ticker": "BAC", "name": "Bank of America Corporation", "sector": "Financial Services"},
    {"ticker": "MA", "name": "Mastercard Incorporated", "sector": "Financial Services"},
    {"ticker": "PFE", "name": "Pfizer Inc.", "sector": "Healthcare"},
    {"ticker": "ABBV", "name": "AbbVie Inc.", "sector": "Healthcare"},
    {"ticker": "COST", "name": "Costco Wholesale Corporation", "sector": "Consumer Defensive"},
    {"ticker": "NKE", "name": "NIKE, Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "ORCL", "name": "Oracle Corporation", "sector": "Technology"},
    {"ticker": "IBM", "name": "International Business Machines Corporation", "sector": "Technology"},
    {"ticker": "T", "name": "AT&T Inc.", "sector": "Communication Services"},
    {"ticker": "BA", "name": "The Boeing Company", "sector": "Industrials"},
    {"ticker": "GE", "name": "GE Aerospace", "sector": "Industrials"},
    {"ticker": "CAT", "name": "Caterpillar Inc.", "sector": "Industrials"},
    {"ticker": "UBER", "name": "Uber Technologies, Inc.", "sector": "Technology"},
    {"ticker": "SBUX", "name": "Starbucks Corporation", "sector": "Consumer Cyclical"},
]

COMPANIES_BY_TICKER = {c["ticker"].upper(): c for c in COMPANIES}


def lookup_static(ticker: str):
    """Return the curated {ticker, name, sector} entry for a ticker, or None."""
    return COMPANIES_BY_TICKER.get(ticker.upper())
