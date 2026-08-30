# Portfolio Risk API

FastAPI backend that serves your frontend's contract using live data from
`yfinance` and the `RandomForestClassifier` in `portfolio_risk_model.pkl`.

## Run it

```bash
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then hit e.g. `http://localhost:8000/api/companies` or
`http://localhost:8000/api/companies/AAPL/risk`.

CORS is wide open (`*`) by default so your frontend can call it straight
from localhost. Restrict it in production via the `CORS_ORIGINS` env var
(comma-separated origins).

## Project layout

```
main.py                 - FastAPI app, CORS, router mount
app/
  routes.py             - all /api/* endpoints
  yf_service.py         - yfinance calls + in-memory TTL caching
  model_service.py      - loads the pkl, builds model features, runs inference
  companies_data.py     - curated ticker/name/sector list for the browse/search list
  schemas.py            - pydantic response models (match your frontend types exactly)
  config.py             - CORS + cache TTL settings, model path
  model/portfolio_risk_model.pkl
```

## What was inside the .pkl

Inspecting it: a `RandomForestClassifier(max_depth=5, random_state=42)`
with `feature_names_in_ = ['Daily_Return', 'Price_to_MA20', 'Volume']` and
`classes_ = [0, 1]` — i.e. it predicts whether the stock's price is more
likely to go **up (1)** or **not-up (0)** next, based on those three
engineered features from the daily price/volume series. `model_service.py`
recomputes these three features from the freshest yfinance daily bar and
calls `predict_proba` on them.

## Endpoint notes / assumptions

Your spec didn't pin down the exact business logic behind a couple of the
`/risk` fields, since the model itself only outputs an up/down
probability. Here's what this implementation does — all in
`model_service.classify_risk`, easy to change:

- **`directionUp` / `directionConfidencePct`** — straight from the model:
  the predicted class and `predict_proba` for that class.
- **`verdict`** (Low/Medium/High Risk) — a heuristic score combining
  realized annualized volatility (80% weight) with the model's directional
  signal (20% weight; a confident "down" prediction nudges risk up, a
  confident "up" prediction nudges it down), bucketed at 25/50.
- **`confidencePct`** — confidence in the *verdict bucket* (distinct from
  `directionConfidencePct`, which is the model's confidence in the
  direction). Computed from how far the risk score sits from the nearest
  bucket boundary.
- **`volatilityPct`** — annualized stdev of daily returns (`std * sqrt(252)
  * 100`) over the trailing ~6 months.
- **`priceToMa20`** — raw ratio `price / 20-day moving average` (e.g.
  `1.03` = 3% above the 20-day MA), matching the model's own feature.
- **`volumeSurgePct`** — `(latest volume - 20-day avg volume) / 20-day avg
  volume * 100`.
- **`low52` / `high52`** — min/max close over the trailing 1 year.
- **`avgVolumeM`** — mean daily volume over the trailing 3 months, in
  millions.
- **`marketCapB`** — from yfinance's `info['marketCap']`, in billions;
  `null` if Yahoo doesn't report it for that ticker.

Adjust the weighting/thresholds in `classify_risk()` if you want the
verdict to match a different rubric.

## Caching

yfinance scrapes Yahoo's endpoints and will slow down or get flaky under
repeated hits, so everything is cached in-memory with TTLs (configurable
via env vars): quotes 30s, charts 5min, company profile 1hr, risk-history
5min. This is per-process — fine for a single backend instance; swap in
Redis if you scale to multiple workers.

## Ticker universe

`/api/companies` and `/api/companies/search` are backed by a curated list
in `companies_data.py` (~40 well-known large caps across sectors) since
yfinance has no "browse all tickers" endpoint. The single-ticker endpoints
(`/api/companies/{ticker}`, `/quote`, `/chart`, `/risk`) work for **any**
valid ticker, not just ones in that list — search also falls back to
treating the query as a raw ticker if there's no match in the curated
list.
