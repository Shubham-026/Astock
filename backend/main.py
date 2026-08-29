from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import our custom routers
from routers import prediction, stocks

# Initialize FastAPI application
app = FastAPI(
    title="Astock Backend API",
    description="Machine Learning & Market Data endpoints for the Astock platform.",
    version="1.0.0"
)

# Configure CORS so the React/Next.js frontend can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (good for local dev/hackathon)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Wire up the routers under the "/api" prefix
app.include_router(prediction.router, prefix="/api", tags=["Predictions"])
app.include_router(stocks.router, prefix="/api", tags=["Stocks & Charts"])

# Basic health check endpoint
@app.get("/")
def read_root():
    return {"status": "success", "message": "Astock backend is running!"}