# Stock Direction & Risk Prediction

A script (exported from a Colab notebook) that downloads historical S&P 500 stock data, engineers features, and trains two Random Forest classifiers:

1. **Direction model** — predicts whether a stock's closing price will go up the next day.
2. **Risk model** — predicts whether a stock's volatility will spike into a high-risk regime.

## What it does

1. **Download** — Pulls ~5 years of daily OHLCV data for a hardcoded list of S&P 500 tickers via `yfinance`, using a thread pool (50 workers). Each ticker is saved to its own `{TICKER}_data.csv`; failures are logged to `failed_queries.txt`.
2. **Combine & clean** — Merges all per-ticker CSVs into one `master_df`, parses dates, coerces numeric columns, and drops bad rows.
3. **Feature engineering** — Computes daily return, 14-day rolling volatility, 20-day moving average, and price-to-MA ratio per stock. Builds two targets: `Target` (next-day up/down) and `High_Risk` (next-day volatility spike relative to that stock's own trailing distribution).
4. **Modeling** —
   - Direction model: `RandomForestClassifier` tuned with `GridSearchCV` over a `TimeSeriesSplit` cross-validation.
   - Risk model: a second `RandomForestClassifier` trained on a separately-computed risk target (top 20% volatility), evaluated with accuracy, precision, recall, F1, MAE, and RMSE.
5. **Visualization** — Plots volatility distribution, confusion matrices, precision-recall curves, feature importances, and a sample stock's price/volatility over time (via `matplotlib`/`seaborn`).
6. **Output** — Saves both trained models as `stock_direction_model.pkl` and `portfolio_risk_model.pkl`.

## Requirements

```
pip install yfinance pandas numpy scikit-learn matplotlib seaborn
```

## Usage

```
python train.py
```

Run it in a directory where it's OK to write the downloaded `*_data.csv` files, `failed_queries.txt`, and the two `.pkl` model files.

## Notes / known issues

- The ticker list is a static snapshot of past S&P 500 constituents; some symbols are delisted/renamed and will land in `failed_queries.txt` (expected).
- Near the end of the script, `feat_names = risk_features` references an undefined variable (should likely be `features`) — this line will raise a `NameError` before the feature-importance plot.
- The two risk targets defined earlier (`High_Risk`, based on per-stock trailing quartile) and later (`Risk_Target`, based on a global 80th-percentile threshold) are different definitions — the second one is what's actually used to train `risk_model`.
- This is a research/prototype script, not production pipeline code — no config file, argument parsing, or tests.