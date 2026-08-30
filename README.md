# Astock: Machine Learning & Portfolio Risk Intelligence Engine

An advanced financial machine learning pipeline engineered to predict market direction and assess portfolio risk states. This repository houses quantitative models designed to provide robust, leak-free risk classification and trend forecasting for modern trading workflows.

---

## Architecture & Core Models

The machine learning system is split into specialized dataframes and models to separate stock price direction forecasting from volatility-based risk assessment:

- **Stock Direction Model (`master_df`)** — Predicts short-term price movement directions (`Target`) across equities.
- **Portfolio Risk Classifier (`risk_df`)** — A specialized classification pipeline built to flag high-volatility, dangerous market states (`Risk_Target`) before adverse drawdowns impact positions.

---

## Feature Engineering & Data Leakage Prevention

To ensure institutional-grade integrity and prevent the model from "cheating" during training, rigorous feature selection protocols were applied to the risk model:

- **Target Definition** — `Risk_Target` is binary-encoded based on rolling volatility thresholds, flagging the top 20% highest volatility states.
- **Leakage Avoidance** — `Volatility_14d` was deliberately dropped from the active feature matrix because the target itself was derived from it.
- **Active Feature Set** — The risk model relies strictly on independent, non-leaking predictors:
  - `Daily_Return`
  - `Price_to_MA20` (price relative to the 20-day moving average)
  - `Volume`

---

## Training & Validation Strategy

To prevent look-ahead bias in time-series financial data, a strict chronological split is enforced rather than random shuffling:

| Step | Detail |
|---|---|
| **Train-Test Split** | Chronological 80/20 split (`split_idx_risk = int(len(risk_df) * 0.8)`) |
| **Training Data** | `risk_df[:split_idx_risk]` — historical market data used to fit pattern boundaries |
| **Testing Data** | `risk_df[split_idx_risk:]` — out-of-sample future timeline used for unbiased evaluation |
| **Algorithm** | `RandomForestClassifier(n_estimators=100, random_state=42, max_depth=5)` |

---

## Evaluation Metrics & Performance

Because financial datasets feature heavily imbalanced class distributions, reliance on raw accuracy is misleading. The model is evaluated across a comprehensive classification and probability error matrix:

| Metric | Score | Interpretation |
|---|---|---|
| **Precision** | 79.88% | Core strength — when the model flags high risk, it's correct nearly 80% of the time, minimizing false alarms |
| **Recall** | 18.89% | Conservative sniper — prioritizes high-confidence certainty over catching every volatile move |
| **F1 Score** | 30.55% | Harmonic balance between precision and recall for skewed financial distributions |
| **Accuracy** | 78.46% | Baseline measure, evaluated alongside precision to account for class imbalance |
| **MAE** | 0.2883 | Mean Absolute Error — tracks probability confidence calibration |
| **RMSE** | 0.3876 | Root Mean Squared Error — penalizes large probability deviation errors |

### Evaluation Script Snippet

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error, mean_squared_error
)
import numpy as np

# Generate predictions and probability distributions
risk_preds = risk_model.predict(X_test_risk)
risk_probs = risk_model.predict_proba(X_test_risk)[:, 1]

# Compute metrics
metrics = {
    "Accuracy": accuracy_score(y_test_risk, risk_preds),
    "Precision": precision_score(y_test_risk, risk_preds, zero_division=0),
    "Recall": recall_score(y_test_risk, risk_preds, zero_division=0),
    "F1 Score": f1_score(y_test_risk, risk_preds, zero_division=0),
    "MAE": mean_absolute_error(y_test_risk, risk_probs),
    "RMSE": np.sqrt(mean_squared_error(y_test_risk, risk_probs))
}

for name, val in metrics.items():
    print(f"{name}: {val:.4f}")
```

---

## Tech Stack

- **Language:** Python
- **Data Processing:** Pandas, NumPy
- **Machine Learning:** Scikit-Learn (`RandomForestClassifier`)
- **Integration:** Next.js Dashboard Backend API / Frontend Interface

---

## Contributors

- Shubham Gupta
- Dipankar Roy
- Ansuman Shaw
- Firdos Khatoon

---

## Disclaimer

This project is for research and educational purposes only. Model outputs (direction predictions and risk flags) do not constitute financial advice. Past performance and backtested metrics do not guarantee future results — always apply independent risk management before acting on model signals.