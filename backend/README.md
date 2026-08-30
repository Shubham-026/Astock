# Portfolio Risk Prediction API

A FastAPI service that serves the trained `portfolio_risk_model.pkl`
(a scikit-learn `RandomForestClassifier`) to classify a stock/portfolio
position as **Low Risk** (0) or **High Risk** (1).

## Project structure

```
.
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app, routes, schemas
│   └── model/
│       └── portfolio_risk_model.pkl
├── requirements.txt
└── README.md
```

## Setup

```bash
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Interactive API docs (Swagger UI): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc
- Health check: http://localhost:8000/health

## API

### `POST /predict`

Request body:

```json
{
  "Daily_Return": 0.012,
  "Price_to_MA20": 1.03,
  "Volume": 1500000
}
```

Response:

```json
{
  "prediction": 0,
  "risk_label": "Low Risk",
  "probability": 0.592845
}
```

### `GET /health`

Returns whether the model loaded correctly on startup — useful for
uptime/liveness checks in production.

## Notes

- **Model version:** the pickle was trained under scikit-learn 1.6.1;
  `requirements.txt` pins scikit-learn 1.8.0, which loads it fine but
  prints an `InconsistentVersionWarning` on startup (visible in the logs,
  harmless here — verified predictions match expected behavior). For
  strict version parity in production, either retrain/re-pickle with
  1.8.0, or pin `scikit-learn==1.6.1` in requirements instead.
- **CORS:** currently wide open (`allow_origins=["*"]`) for ease of
  frontend development. Restrict this to your actual frontend origin(s)
  before deploying to production.
- **Error handling:**
  - Missing/corrupt model file → app still starts, `/predict` returns
    `503 Service Unavailable`, `/health` reports `model_loaded: false`.
  - Malformed request body (wrong types/missing fields) → FastAPI/Pydantic
    returns `422 Unprocessable Entity` automatically.
  - NaN/Infinite input values → `400 Bad Request`.
  - Any other unexpected model error → `500 Internal Server Error` with
    the exception message.
- The `stock_direction_model.pkl` you also uploaded (4 features, different
  target) was **not** wired up, since it wasn't part of the stated
  requirements — happy to add a second endpoint for it if useful.
