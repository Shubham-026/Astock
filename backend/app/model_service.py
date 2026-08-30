"""
Wraps the trained sklearn RandomForestClassifier from
app/model/portfolio_risk_model.pkl.

Inspecting the pickle shows:

    RandomForestClassifier(max_depth=5, random_state=42)
    feature_names_in_ = ['Daily_Return', 'Price_to_MA20', 'Volume']
    classes_           = [0, 1]   # 0 = down/flat, 1 = up

i.e. it's a binary "will the stock move up next?" classifier trained on
three engineered features. This module recomputes those same three
features from live yfinance data and calls the model.
"""
import logging
import pickle
import warnings

import numpy as np
import pandas as pd

from app.config import MODEL_PATH

logger = logging.getLogger("model_service")

FEATURE_ORDER = ["Daily_Return", "Price_to_MA20", "Volume"]

_model = None


def load_model():
    """Load (and cache) the pickled model. Raises if the file is missing/corrupt."""
    global _model
    if _model is None:
        with warnings.catch_warnings():
            # The pickle was trained on an older sklearn point release;
            # this only warns, it doesn't break inference.
            warnings.simplefilter("ignore")
            with open(MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
        logger.info("Loaded risk model from %s", MODEL_PATH)
    return _model


def build_features(history: pd.DataFrame) -> dict:
    """
    Compute the three model features from a daily OHLCV history DataFrame
    (as returned by yfinance's `Ticker.history()`), using the most recent
    trading day.

    Returns a dict with the raw feature values plus a couple of extra
    derived stats the /risk endpoint needs (volatility, volume surge, MAs).
    """
    if history is None or history.empty or len(history) < 21:
        raise ValueError("Not enough price history to compute features (need 20+ trading days)")

    close = history["Close"].dropna()
    volume = history["Volume"].dropna()

    daily_returns = close.pct_change().dropna()
    ma20 = close.rolling(window=20).mean()
    avg_volume_20 = volume.rolling(window=20).mean()

    latest_close = float(close.iloc[-1])
    latest_ma20 = float(ma20.iloc[-1])
    latest_daily_return = float(daily_returns.iloc[-1])
    latest_volume = float(volume.iloc[-1])
    latest_avg_volume_20 = float(avg_volume_20.iloc[-1])

    price_to_ma20 = latest_close / latest_ma20 if latest_ma20 else 1.0

    # Annualized volatility (%) from daily returns over the available window.
    volatility_pct = float(daily_returns.std() * np.sqrt(252) * 100)

    volume_surge_pct = (
        ((latest_volume - latest_avg_volume_20) / latest_avg_volume_20) * 100
        if latest_avg_volume_20
        else 0.0
    )

    return {
        "Daily_Return": latest_daily_return,
        "Price_to_MA20": price_to_ma20,
        "Volume": latest_volume,
        "volatility_pct": volatility_pct,
        "volume_surge_pct": volume_surge_pct,
        "avg_volume_20": latest_avg_volume_20,
    }


def predict_direction(features: dict):
    """
    Run the model on the given feature dict.
    Returns (direction_up: bool, confidence_pct: float).
    """
    model = load_model()
    row = pd.DataFrame([[features[name] for name in FEATURE_ORDER]], columns=FEATURE_ORDER)

    proba = model.predict_proba(row)[0]
    classes = list(model.classes_)
    up_index = classes.index(1) if 1 in classes else int(np.argmax(proba))

    up_proba = float(proba[up_index])
    direction_up = up_proba >= 0.5
    confidence_pct = (up_proba if direction_up else 1 - up_proba) * 100
    return direction_up, confidence_pct


def classify_risk(volatility_pct: float, direction_confidence_pct: float, direction_up: bool):
    """
    Turn the raw model output + volatility into a human verdict and an
    overall confidence for that verdict.

    This bucketing is a heuristic (the model itself only predicts
    direction) built from two signals:
      - volatility_pct: higher realized volatility -> higher risk
      - direction_confidence_pct combined with direction_up: a confident
        "down" prediction pushes risk up; a confident "up" prediction
        pulls it down.
    """
    # Fold direction into a single -100..100 "risk pressure" score:
    # confident down-moves add risk, confident up-moves reduce it.
    directional_pressure = direction_confidence_pct if not direction_up else -direction_confidence_pct

    # Weighted composite score used only to pick a bucket.
    risk_score = (volatility_pct * 0.8) + (directional_pressure * 0.2)

    if risk_score < 25:
        verdict = "Low Risk"
        low, high = 0, 25
    elif risk_score < 50:
        verdict = "Medium Risk"
        low, high = 25, 50
    else:
        verdict = "High Risk"
        low, high = 50, max(51, risk_score)

    # Confidence in the *bucket* choice: how far risk_score sits from the
    # nearest bucket boundary, normalized to 60-99%.
    span = max(high - low, 1)
    distance_into_bucket = min(abs(risk_score - low), abs(high - risk_score), span / 2)
    confidence_pct = 60 + (distance_into_bucket / (span / 2)) * 39
    confidence_pct = float(min(99.0, max(60.0, confidence_pct)))

    return verdict, confidence_pct
