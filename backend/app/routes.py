import logging

from fastapi import APIRouter, HTTPException, Query

from app import model_service, yf_service
from app.companies_data import COMPANIES, lookup_static
from app.schemas import Chart, CompanyDetail, CompanyListItem, Quote, RiskAssessment
from app.yf_service import TickerNotFoundError

logger = logging.getLogger("routes")
router = APIRouter(prefix="/api")


def _company_list_item(ticker: str, static_entry: dict | None) -> CompanyListItem:
    quote = yf_service.get_quote(ticker)
    name = static_entry["name"] if static_entry else ticker.upper()
    sector = static_entry["sector"] if static_entry else "Diversified"
    return CompanyListItem(ticker=ticker.upper(), name=name, sector=sector, **quote)


@router.get("/companies", response_model=list[CompanyListItem])
def list_companies():
    """The default browsable universe (curated tickers), each with a live quote."""
    results = []
    for entry in COMPANIES:
        try:
            results.append(_company_list_item(entry["ticker"], entry))
        except TickerNotFoundError:
            logger.warning("Skipping %s in company list: no data", entry["ticker"])
            continue
    return results


@router.get("/companies/search", response_model=list[CompanyListItem])
def search_companies(q: str = Query(..., min_length=1)):
    """
    Search the curated universe by ticker or name. If nothing matches and
    the query itself looks like a valid ticker, fall back to fetching it
    directly from yfinance so the search box also works for tickers
    outside the curated list.
    """
    needle = q.strip().upper()
    matches = [
        c
        for c in COMPANIES
        if needle in c["ticker"].upper() or needle in c["name"].upper()
    ]

    if matches:
        results = []
        for entry in matches:
            try:
                results.append(_company_list_item(entry["ticker"], entry))
            except TickerNotFoundError:
                continue
        return results

    # Fallback: treat the query as a raw ticker symbol.
    try:
        return [_company_list_item(needle, lookup_static(needle))]
    except TickerNotFoundError:
        return []


@router.get("/companies/{ticker}", response_model=CompanyDetail)
def get_company(ticker: str):
    static_entry = lookup_static(ticker)
    try:
        quote = yf_service.get_quote(ticker)
        profile = yf_service.get_profile(ticker)
    except TickerNotFoundError:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'")

    name = static_entry["name"] if static_entry else profile["name"]
    sector = static_entry["sector"] if static_entry else profile["sector"]

    return CompanyDetail(
        ticker=ticker.upper(),
        name=name,
        sector=sector,
        summary=profile["summary"],
        **quote,
    )


@router.get("/companies/{ticker}/quote", response_model=Quote)
def get_quote(ticker: str):
    try:
        return Quote(**yf_service.get_quote(ticker))
    except TickerNotFoundError:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'")


@router.get("/companies/{ticker}/chart", response_model=Chart)
def get_chart(ticker: str, range: int = Query(30, description="30 | 90 | 180 | 365")):
    if range not in (30, 90, 180, 365):
        raise HTTPException(status_code=400, detail="range must be one of 30, 90, 180, 365")
    try:
        prices = yf_service.get_chart(ticker, range)
    except TickerNotFoundError:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'")
    return Chart(prices=prices)


@router.get("/companies/{ticker}/risk", response_model=RiskAssessment)
def get_risk(ticker: str):
    try:
        history = yf_service.get_risk_history(ticker)
        week_range = yf_service.get_52w_range(ticker)
        avg_volume_m = yf_service.get_avg_volume_m(ticker)
    except TickerNotFoundError:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'")

    try:
        features = model_service.build_features(history)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    direction_up, direction_confidence_pct = model_service.predict_direction(features)
    verdict, confidence_pct = model_service.classify_risk(
        features["volatility_pct"], direction_confidence_pct, direction_up
    )

    market_cap_b = None
    try:
        market_cap_b = yf_service.get_profile(ticker).get("marketCapB")
    except TickerNotFoundError:
        pass

    return RiskAssessment(
        verdict=verdict,
        confidencePct=round(confidence_pct, 1),
        volatilityPct=round(features["volatility_pct"], 2),
        priceToMa20=round(features["Price_to_MA20"], 4),
        volumeSurgePct=round(features["volume_surge_pct"], 2),
        directionUp=direction_up,
        directionConfidencePct=round(direction_confidence_pct, 1),
        low52=week_range["low52"],
        high52=week_range["high52"],
        avgVolumeM=avg_volume_m,
        marketCapB=market_cap_b,
    )
