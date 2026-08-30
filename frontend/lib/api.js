/**
 * ASTOCK API client
 * ==================
 * Single place that talks to the backend. Every component/page imports
 * from here instead of calling fetch() directly, so if your backend's
 * routes or response shapes differ, this is the only file to edit.
 *
 * Set NEXT_PUBLIC_API_BASE_URL in .env.local to point at your backend,
 * e.g. NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
 * Defaults to http://localhost:8000 if unset.
 *
 * ---------------------------------------------------------------------
 * Expected backend contract
 * ---------------------------------------------------------------------
 * GET  /api/companies
 *   -> [{ ticker, name, sector, price, change }, ...]
 *   (change = % change today, e.g. 1.42 or -0.83)
 *
 * GET  /api/companies/:ticker
 *   -> { ticker, name, sector, summary, price, change }
 *
 * GET  /api/companies/:ticker/quote
 *   -> { price, change }
 *   (cheap, frequently-polled endpoint for live header/marquee prices)
 *
 * GET  /api/companies/:ticker/chart?range=30
 *   range is one of 30 | 90 | 180 | 365 (days)
 *   -> { prices: number[] }   // oldest -> newest, last value = current price
 *
 * GET  /api/companies/:ticker/risk
 *   -> {
 *        verdict: "high" | "low",
 *        confidencePct: number,        // 0-100
 *        volatilityPct: number,        // e.g. 2.35
 *        priceToMa20: number,          // e.g. 1.02
 *        volumeSurgePct: number,       // 0-100
 *        directionUp: boolean,
 *        directionConfidencePct: number,
 *        low52: number,
 *        high52: number,
 *        avgVolumeM: number,           // millions of shares
 *        marketCapB: number            // billions of $
 *      }
 *
 * GET  /api/companies/search?q=AAPL
 *   -> [{ ticker, name, sector, price, change }, ...]   (top matches)
 *   Optional — if you don't implement this, the search bar falls back
 *   to filtering whatever /api/companies already returned client-side.
 * ---------------------------------------------------------------------
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    // Real-time market data shouldn't be cached by Next's fetch cache.
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(`${path} failed with ${res.status}`, res.status);
  }
  return res.json();
}

export function fetchCompanies() {
  return request("/api/companies");
}

export function fetchCompany(ticker) {
  return request(`/api/companies/${encodeURIComponent(ticker)}`);
}

export function fetchQuote(ticker) {
  return request(`/api/companies/${encodeURIComponent(ticker)}/quote`);
}

export function fetchChart(ticker, rangeDays) {
  return request(
    `/api/companies/${encodeURIComponent(ticker)}/chart?range=${rangeDays}`
  );
}

export function fetchRisk(ticker) {
  return request(`/api/companies/${encodeURIComponent(ticker)}/risk`);
}

export async function searchCompanies(query, allCompanies = []) {
  const q = query.trim();
  if (!q) return [];
  try {
    return await request(`/api/companies/search?q=${encodeURIComponent(q)}`);
  } catch {
    // Fall back to client-side filtering over whatever list we already have.
    const upper = q.toUpperCase();
    return allCompanies
      .filter(
        (c) =>
          c.ticker.toUpperCase().includes(upper) ||
          c.name.toUpperCase().includes(upper)
      )
      .slice(0, 6);
  }
}

export { ApiError, API_BASE };
