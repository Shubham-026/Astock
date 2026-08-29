import { ChartPoint, ChartRange, CompanyInfo, Prediction, Stock } from "./types";
import { getChartData, getCompanyInfo, getMockStocks, getPrediction } from "./mockData";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

async function safeFetch<T>(path: string, fallback: () => T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      // Keep this fast: don't let a dead local backend stall the UI.
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as T;
  } catch {
    // Backend not running / unreachable -> fall back to mock data so the
    // frontend remains fully demoable on its own.
    return fallback();
  }
}

export async function fetchStocks(): Promise<Stock[]> {
  return safeFetch<Stock[]>("/stocks", () => getMockStocks(200));
}

export async function fetchCompanyInfo(symbol: string): Promise<CompanyInfo | undefined> {
  return safeFetch<CompanyInfo | undefined>(`/info/${symbol}`, () => getCompanyInfo(symbol));
}

export async function fetchChart(symbol: string, range: ChartRange): Promise<ChartPoint[]> {
  return safeFetch<ChartPoint[]>(`/chart/${symbol}?range=${range}`, () =>
    getChartData(symbol, range)
  );
}

export async function fetchPrediction(symbol: string): Promise<Prediction | undefined> {
  return safeFetch<Prediction | undefined>(`/predict/${symbol}`, () => getPrediction(symbol));
}
