"""
Central configuration for the backend.
"""
import os

# Comma-separated list of origins allowed to call this API.
# Set to "*" (default) to allow any origin - fine for local dev,
# tighten this in production by setting the CORS_ORIGINS env var.
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

# TTL (seconds) for cached yfinance responses. yfinance scrapes Yahoo
# endpoints under the hood and will rate-limit / slow down if hit too
# often, so we cache aggressively.
QUOTE_CACHE_TTL = int(os.environ.get("QUOTE_CACHE_TTL", "30"))
CHART_CACHE_TTL = int(os.environ.get("CHART_CACHE_TTL", "300"))
PROFILE_CACHE_TTL = int(os.environ.get("PROFILE_CACHE_TTL", "3600"))
RISK_CACHE_TTL = int(os.environ.get("RISK_CACHE_TTL", "300"))

# Path to the trained model pickle.
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "portfolio_risk_model.pkl")
