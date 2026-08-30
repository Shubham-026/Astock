from pydantic import BaseModel

# Defines the expected payload when the frontend requests a prediction
class StockPredictionRequest(BaseModel):
    symbol: str
    pe_ratio: float
    market_cap_b: float
    dividend_yield: float
    change_pct: float
    volume_m: float
    fifty_two_wk_change_pct: float

# Defines how the backend will structure the response
class StockPredictionResponse(BaseModel):
    symbol: str
    predicted_return_pct: float
    risk_score_10: float
    risk_category: str