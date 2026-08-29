from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()

@router.get("/chart/{symbol}")
def get_chart_data(symbol: str, period: str = "1mo", interval: str = "1d"):
    """
    Fetches historical price data for charting.
    Example: /api/chart/AAPL?period=6mo&interval=1d
    """
    try:
        stock = yf.Ticker(symbol.upper())
        df = stock.history(period=period, interval=interval)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="Symbol not found or no data available.")
            
        # Safely handle the index
        df = df.reset_index()
        
        # Find the date column dynamically
        date_col = 'Datetime' if 'Datetime' in df.columns else 'Date'
        
        # Convert to string to avoid JSON datetime serialization issues
        df[date_col] = df[date_col].astype(str)
        
        # 1. FIX: Replace any NaN values with 0. NaN breaks JSON serialization!
        df = df.fillna(0)
        
        # 2. FIX: Safely select columns (just in case yfinance omits a column)
        desired_cols = [date_col, 'Open', 'High', 'Low', 'Close', 'Volume']
        valid_cols = [col for col in desired_cols if col in df.columns]
        
        records = df[valid_cols].to_dict(orient="records")
        
        # 3. FIX: Standardize the key name to 'Date' for the frontend
        for record in records:
            if date_col != 'Date' and date_col in record:
                record['Date'] = record.pop(date_col)
                
        return {"symbol": symbol.upper(), "data": records}
        
    except Exception as e:
        # Print the exact error to your terminal so we can debug if it fails again
        print(f"DEBUG - Chart Error for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info/{symbol}")
def get_stock_info(symbol: str):
    """
    Fetches current company information, summaries, and real-time prices.
    Example: /api/info/AAPL
    """
    try:
        stock = yf.Ticker(symbol.upper())
        info = stock.info
        
        return {
            "symbol": symbol.upper(),
            "name": info.get("longName", info.get("shortName", symbol.upper())),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "summary": info.get("longBusinessSummary", "No company summary available."),
            "current_price": info.get("currentPrice", info.get("regularMarketPrice", 0.0))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))