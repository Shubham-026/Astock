export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number; // percentage change, e.g. 1.24 or -0.87
  volume: string;
}

export interface CompanyInfo {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  summary: string;
  peRatio: number;
  marketCap: string;
  dividendYield: number;
  ebitda: string;
  weekHigh52: number;
  weekLow52: number;
}

export interface ChartPoint {
  date: string;
  price: number;
}

export type ChartRange = "1M" | "6M" | "1Y";

export interface Prediction {
  symbol: string;
  expectedReturn: number; // percentage, signed
  confidence: number; // 0 - 100
  riskScore: number; // 1.0 - 10.0
  horizon: string;
  narrative: string;
}
