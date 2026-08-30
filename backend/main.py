"""
Entrypoint for the portfolio risk backend.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Endpoints (see app/routes.py):
    GET /api/companies
    GET /api/companies/search?q=
    GET /api/companies/{ticker}
    GET /api/companies/{ticker}/quote
    GET /api/companies/{ticker}/chart?range=30|90|180|365
    GET /api/companies/{ticker}/risk
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routes import router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Portfolio Risk API", version="1.0.0")

origins = ["*"] if CORS_ORIGINS == "*" else [o.strip() for o in CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
