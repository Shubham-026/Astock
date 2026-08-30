from typing import List, Optional
from pydantic import BaseModel


class CompanyListItem(BaseModel):
    ticker: str
    name: str
    sector: str
    price: float
    change: float  # percent change, e.g. 1.23 means +1.23%


class CompanyDetail(BaseModel):
    ticker: str
    name: str
    sector: str
    summary: str
    price: float
    change: float


class Quote(BaseModel):
    price: float
    change: float


class Chart(BaseModel):
    prices: List[float]


class RiskAssessment(BaseModel):
    verdict: str
    confidencePct: float
    volatilityPct: float
    priceToMa20: float
    volumeSurgePct: float
    directionUp: bool
    directionConfidencePct: float
    low52: float
    high52: float
    avgVolumeM: float
    marketCapB: Optional[float] = None
