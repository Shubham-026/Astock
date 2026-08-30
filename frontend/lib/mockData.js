// ---------------------------------------------------------------------------
// Mock market data — replaces backend calls in lib/api.js.
// Everything here is deterministic-ish fake data generated in the browser.
// ---------------------------------------------------------------------------

// Simple seeded RNG so a given ticker always produces the same "shape"
// of chart / risk numbers within a session, instead of pure Math.random().
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return function () {
    h = (h ^ (h << 13)) | 0;
    h = (h ^ (h >>> 17)) | 0;
    h = (h ^ (h << 5)) | 0;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export const COMPANIES_SEED = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", base: 227.5 },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", base: 431.2 },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", base: 178.9 },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", base: 197.3 },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", base: 128.4 },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", base: 563.8 },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", base: 251.6 },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", base: 214.7 },
  { ticker: "V", name: "Visa Inc.", sector: "Financials", base: 289.1 },
  { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer Staples", base: 88.4 },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", base: 156.9 },
  { ticker: "PG", name: "Procter & Gamble", sector: "Consumer Staples", base: 168.2 },
  { ticker: "UNH", name: "UnitedHealth Group", sector: "Healthcare", base: 519.3 },
  { ticker: "HD", name: "The Home Depot Inc.", sector: "Consumer Discretionary", base: 401.7 },
  { ticker: "MA", name: "Mastercard Inc.", sector: "Financials", base: 512.4 },
  { ticker: "DIS", name: "The Walt Disney Co.", sector: "Communication Services", base: 112.8 },
  { ticker: "BAC", name: "Bank of America Corp.", sector: "Financials", base: 43.6 },
  { ticker: "ADBE", name: "Adobe Inc.", sector: "Technology", base: 486.2 },
  { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", base: 267.5 },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Communication Services", base: 724.1 },
  { ticker: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", base: 116.3 },
  { ticker: "CVX", name: "Chevron Corp.", sector: "Energy", base: 154.8 },
  { ticker: "KO", name: "The Coca-Cola Co.", sector: "Consumer Staples", base: 68.9 },
  { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples", base: 149.6 },
  { ticker: "INTC", name: "Intel Corp.", sector: "Technology", base: 22.4 },
];

const SUMMARY_TEMPLATES = [
  "Covers a broad {sector} footprint with steady institutional ownership and consistent trading volume.",
  "A large-cap {sector} name closely tracked by the model for regime shifts in volatility.",
  "One of the more liquid names in {sector}, frequently used as a sector bellwether.",
  "Model flags this {sector} constituent for above-average sensitivity to macro data prints.",
  "A core holding across major indices, with {sector} exposure that skews defensive.",
];

function buildCompany(seed) {
  const rand = seededRandom(seed.ticker);
  const changePct = (rand() - 0.45) * 4; // roughly -1.8% .. +2.2%
  const price = seed.base * (1 + changePct / 100);
  const summary = SUMMARY_TEMPLATES[Math.floor(rand() * SUMMARY_TEMPLATES.length)].replace(
    /\{sector\}/g,
    seed.sector
  );

  return {
    ticker: seed.ticker,
    name: seed.name,
    sector: seed.sector,
    price: Number(price.toFixed(2)),
    change: Number(changePct.toFixed(2)),
    summary,
  };
}

export const COMPANIES = COMPANIES_SEED.map(buildCompany);

export function getAllowedTickers() {
  return COMPANIES.map((c) => c.ticker);
}

export function searchCompaniesLocal(query, companies = COMPANIES) {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return companies
    .filter((c) => c.ticker.toUpperCase().includes(q) || c.name.toUpperCase().includes(q))
    .slice(0, 8);
}

export function getCompany(ticker) {
  return COMPANIES.find((c) => c.ticker.toUpperCase() === ticker.toUpperCase()) || null;
}

// ---- risk panel mock data --------------------------------------------------
export function getRisk(ticker) {
  const company = getCompany(ticker) || { price: 100, change: 0 };
  const rand = seededRandom(`risk-${ticker}`);

  const volatilityPct = 1 + rand() * 4.5; // 1% .. 5.5%
  const priceToMa20 = 0.94 + rand() * 0.12; // 0.94x .. 1.06x
  const volumeSurgePct = Math.round(20 + rand() * 75);
  const isHighRisk = volatilityPct > 3.2 || Math.abs(priceToMa20 - 1) > 0.05;
  const confidencePct = Math.round(58 + rand() * 37);

  const low52 = company.price * (0.7 + rand() * 0.1);
  const high52 = company.price * (1.15 + rand() * 0.2);
  const avgVolumeM = 5 + rand() * 60;
  const marketCapB = 40 + rand() * 2800;

  const directionUp = rand() > 0.45;
  const directionConfidencePct = 50 + rand() * 45;

  return {
    verdict: isHighRisk ? "high" : "low",
    confidencePct,
    low52: Number(low52.toFixed(2)),
    high52: Number(high52.toFixed(2)),
    avgVolumeM: Number(avgVolumeM.toFixed(1)),
    marketCapB: Number(marketCapB.toFixed(0)),
    volatilityPct: Number(volatilityPct.toFixed(2)),
    priceToMa20: Number(priceToMa20.toFixed(2)),
    volumeSurgePct,
    directionUp,
    directionConfidencePct: Number(directionConfidencePct.toFixed(0)),
  };
}

// ---- chart series -----------------------------------------------------------
export function getChartSeries(ticker, days = 30) {
  const company = getCompany(ticker) || { price: 100 };
  const rand = seededRandom(`chart-${ticker}-${days}`);

  const points = Math.max(20, Math.min(days, 260));
  const drift = (rand() - 0.48) * 0.0025; // slight per-step trend
  let value = company.price * (0.85 + rand() * 0.1);
  const series = [];

  for (let i = 0; i < points; i++) {
    const shock = (rand() - 0.5) * value * 0.018;
    value = Math.max(1, value * (1 + drift) + shock);
    series.push(Number(value.toFixed(2)));
  }
  // make the series end near the current quoted price for continuity
  series[series.length - 1] = company.price;
  return series;
}

// ---- live-quote jitter, used to simulate polling without a backend --------
export function jitterQuote(ticker, current) {
  const rand = seededRandom(`${ticker}-${Date.now()}-${Math.random()}`);
  const price = Math.max(0.5, current.price * (1 + (rand() - 0.5) * 0.004));
  const change = current.change + (rand() - 0.5) * 0.08;
  return {
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
  };
}