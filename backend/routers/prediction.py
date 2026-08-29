from fastapi import APIRouter, HTTPException
import joblib
import pandas as pd
import os
from schema import StockPredictionRequest, StockPredictionResponse

router = APIRouter()

# Construct absolute paths to ensure the models load correctly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RETURN_MODEL_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "return_regressor.pkl")
RISK_MODEL_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "risk_score_regressor.pkl")

# Load ML artifacts into memory
try:
    return_model = joblib.load(RETURN_MODEL_PATH)
    risk_model = joblib.load(RISK_MODEL_PATH)
    print("Machine Learning models loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load ML models. Error: {e}")
    return_model = None
    risk_model = None

@router.post("/predict", response_model=StockPredictionResponse)
def predict_stock(data: StockPredictionRequest):
    if not return_model or not risk_model:
        raise HTTPException(status_code=500, detail="Model artifacts not found.")
    
    # 1. Map our API request data, taking care to match exact column names from the CSV (like spaces!)
    incoming_data = {
        'PE_Ratio': data.pe_ratio,
        'Market_Cap_B': data.market_cap_b,
        'Dividend Yield': data.dividend_yield, # Matched the space instead of underscore
        'Change %': data.change_pct,
        'Volume_M': data.volume_m,
        '52_WK_Change %': data.fifty_two_wk_change_pct
    }
    
    try:
        # 2. Get the EXACT list of features the model memorized during Colab training
        expected_features = return_model.feature_names_in_
        
        # 3. Create a new dictionary holding ALL expected features.
        # If the feature is in our API data, use it. Otherwise, fill it with 0.0 to prevent crashes.
        full_data = {feature: incoming_data.get(feature, 0.0) for feature in expected_features}
        
        # 4. Create the final DataFrame
        input_df = pd.DataFrame([full_data])
        
        # Run inference
        pred_return = float(return_model.predict(input_df)[0])
        pred_risk = float(risk_model.predict(input_df)[0])
        
        # Categorize risk
        risk_category = "Low" if pred_risk < 4.0 else ("Moderate" if pred_risk < 7.0 else "High")
        
        return {
            "symbol": data.symbol.upper(),
            "predicted_return_pct": round(pred_return, 2),
            "risk_score_10": round(pred_risk, 1),
            "risk_category": risk_category
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")