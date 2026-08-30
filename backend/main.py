"""
Portfolio Risk Prediction API
==============================
A production-ready FastAPI service that wraps a pre-trained scikit-learn
RandomForestClassifier to predict portfolio/stock risk (Low Risk vs High Risk).

Run locally:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Then open http://localhost:8000/docs for interactive Swagger UI.
"""

import logging
import pickle
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("portfolio_risk_api")

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------
# Path to the trained model artifact. Override by setting MODEL_PATH env var.
MODEL_PATH = Path(__file__).resolve().parent / "model" / "portfolio_risk_model.pkl"

# The exact feature order the model was trained on. Order matters for
# scikit-learn estimators when features are passed positionally, so we
# always build the inference DataFrame with these column names/order.
FEATURE_COLUMNS = ["Daily_Return", "Price_to_MA20", "Volume"]

# Human-readable labels for the model's binary output classes.
RISK_LABELS = {0: "Low Risk", 1: "High Risk"}

# --------------------------------------------------------------------------
# Model container
# --------------------------------------------------------------------------
# A tiny wrapper so the loaded model + load-state can be shared cleanly
# across the app without relying on a bare global variable.
class ModelStore:
    def __init__(self) -> None:
        self.model = None
        self.load_error: Optional[str] = None

    def is_ready(self) -> bool:
        return self.model is not None


model_store = ModelStore()


def load_model() -> None:
    """Load the pickled model from disk into `model_store`.

    Any failure here is captured (not raised) so the app can still start
    and report a clear 503 on /predict rather than crashing on boot.
    """
    try:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)

        # Sanity check: the model should support predict / predict_proba.
        if not hasattr(model, "predict"):
            raise TypeError("Loaded object does not implement a predict() method.")

        model_store.model = model
        model_store.load_error = None
        logger.info("Model loaded successfully from %s", MODEL_PATH)

    except Exception as exc:  # noqa: BLE001 - we want to capture *any* load failure
        model_store.model = None
        model_store.load_error = str(exc)
        logger.error("Failed to load model: %s", exc)


# --------------------------------------------------------------------------
# App lifespan (startup/shutdown)
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Portfolio Risk Prediction API...")
    load_model()
    yield
    logger.info("Shutting down Portfolio Risk Prediction API...")


# --------------------------------------------------------------------------
# FastAPI app instance
# --------------------------------------------------------------------------
app = FastAPI(
    title="Portfolio Risk Prediction API",
    description=(
        "Serves a trained Random Forest model that classifies a stock/portfolio "
        "position as **Low Risk** or **High Risk** based on three engineered "
        "features: daily return, price relative to its 20-day moving average, "
        "and trading volume."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# --------------------------------------------------------------------------
# CORS
# --------------------------------------------------------------------------
# Wide-open by default so any frontend (React/Vue/etc dev server, or a
# hosted app) can call this API during development. Lock this down to
# specific origins before deploying to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # TODO: restrict to your frontend's domain(s) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Pydantic schemas
# --------------------------------------------------------------------------
class StockInput(BaseModel):
    """Input features required for a single risk prediction."""

    Daily_Return: float = Field(
        ...,
        description="Daily percentage return of the stock, e.g. 0.015 for +1.5%.",
        json_schema_extra={"example": 0.012},
    )
    Price_to_MA20: float = Field(
        ...,
        description="Ratio of current price to its 20-day moving average.",
        json_schema_extra={"example": 1.03},
    )
    Volume: float = Field(
        ...,
        description="Trading volume for the period.",
        json_schema_extra={"example": 1_500_000.0},
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "Daily_Return": 0.012,
                    "Price_to_MA20": 1.03,
                    "Volume": 1500000.0,
                },
                {
                    "Daily_Return": -0.045,
                    "Price_to_MA20": 0.91,
                    "Volume": 8200000.0,
                },
            ]
        }
    }


class PredictionResponse(BaseModel):
    """Response returned by the /predict endpoint."""

    prediction: int = Field(..., description="Raw model output: 0 = Low Risk, 1 = High Risk.")
    risk_label: str = Field(..., description="Human-readable risk classification.")
    probability: float = Field(
        ...,
        description="Model's confidence in the predicted class (0.0-1.0). "
        "Falls back to 1.0 if the underlying model has no predict_proba method.",
    )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    detail: Optional[str] = None


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.get("/", tags=["Health"], summary="Root/info endpoint")
def read_root():
    return {
        "service": "Portfolio Risk Prediction API",
        "docs": "/docs",
        "health": "/health",
        "predict": "/predict (POST)",
    }


@app.get(
    "/health",
    tags=["Health"],
    response_model=HealthResponse,
    summary="Check API and model health",
)
def health_check():
    """Report whether the model loaded successfully. Useful for uptime checks."""
    if model_store.is_ready():
        return HealthResponse(status="ok", model_loaded=True)
    return HealthResponse(
        status="degraded",
        model_loaded=False,
        detail=model_store.load_error or "Model not loaded.",
    )


@app.post(
    "/predict",
    tags=["Prediction"],
    response_model=PredictionResponse,
    summary="Predict portfolio risk for a single position",
    responses={
        503: {"description": "Model is not loaded / unavailable."},
        400: {"description": "Invalid or unusable input data."},
    },
)
def predict(payload: StockInput) -> PredictionResponse:
    """
    Predict whether a stock/portfolio position is **Low Risk** or **High Risk**.

    Takes `Daily_Return`, `Price_to_MA20`, and `Volume`, runs them through the
    trained Random Forest model, and returns the predicted class, a
    human-readable label, and the model's confidence score.
    """
    # --- Guard: model must be loaded ---
    if not model_store.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model is not available: {model_store.load_error or 'unknown error'}",
        )

    model = model_store.model

    try:
        # Build a single-row DataFrame with the exact column names/order the
        # model was trained on. Using a DataFrame (not a raw array) avoids
        # sklearn's "X does not have valid feature names" warnings and keeps
        # column-order bugs from silently corrupting predictions.
        input_df = pd.DataFrame(
            [[payload.Daily_Return, payload.Price_to_MA20, payload.Volume]],
            columns=FEATURE_COLUMNS,
        )

        # Reject non-finite input (NaN/Inf) which would otherwise silently
        # produce a nonsensical prediction.
        if not np.all(np.isfinite(input_df.values)):
            raise ValueError("Input contains NaN or infinite values.")

        prediction = model.predict(input_df)
        predicted_class = int(prediction[0])

        # Confidence score: use predict_proba if the model supports it,
        # otherwise fall back to full confidence (1.0) since a hard
        # prediction was still made.
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_df)[0]
            class_index = list(model.classes_).index(predicted_class)
            confidence = float(probabilities[class_index])
        else:
            confidence = 1.0

        risk_label = RISK_LABELS.get(predicted_class, str(predicted_class))

        return PredictionResponse(
            prediction=predicted_class,
            risk_label=risk_label,
            probability=round(confidence, 6),
        )

    except ValueError as ve:
        # Bad/unusable input data (e.g. NaN, infinite values)
        logger.warning("Bad input for prediction: %s", ve)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    except Exception as exc:  # noqa: BLE001 - surface any unexpected model error cleanly
        logger.exception("Unexpected error during prediction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {exc}",
        )
