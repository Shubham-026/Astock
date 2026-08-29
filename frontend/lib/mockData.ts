import { ChartPoint, ChartRange, CompanyInfo, Prediction, Stock } from "./types";

// Seeded PRNG (mulberry32) so server and client render identical mock data.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financials",
  "Energy",
  "Consumer Discretionary",
  "Industrials",
  "Communication Services",
  "Materials",
  "Utilities",
  "Real Estate",
];

const NAME_PREFIXES = [
  "Nova", "Vertex", "Quantum", "Orbit", "Helio", "Cobalt", "Summit", "Lumen",
  "Cascade", "Ember", "Atlas", "Pioneer", "Meridian", "Zenith", "Beacon",
  "Catalyst", "Ridge", "Harbor", "Falcon", "Nimbus", "Granite", "Vector",
  "Pulse", "Anchor", "Crescent", "Delta", "Echo", "Frontier", "Ironclad",
  "Junction", "Keystone", "Lattice", "Momentum", "Northgate", "Onyx",
  "Prism", "Quartz", "Redwood", "Solstice", "Tundra",
];

const NAME_SUFFIXES = [
  "Technologies", "Systems", "Holdings", "Industries", "Networks", "Energy",
  "Biotech", "Financial Group", "Materials", "Robotics", "Dynamics", "Labs",
  "Pharma", "Logistics", "Capital", "Motors", "Semiconductor", "Analytics",
  "Aerospace", "Foods",
];

function generateSymbol(index: number, rand: () => number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const len = index < 30 ? 3 : 4;
  let s = "";
  for (let i = 0; i < len; i++) {
    s += letters[Math.floor(rand() * letters.length)];
  }
  return s;
}

function buildStock(index: number): Stock {
  const rand = mulberry32(1000 + index * 97);
  const symbol = generateSymbol(index, rand) + (index % 7 === 0 ? "X" : "");
  const prefix = NAME_PREFIXES[index % NAME_PREFIXES.length];
  const suffix = NAME_SUFFIXES[Math.floor(index / NAME_PREFIXES.length) % NAME_SUFFIXES.length];
  const name = `${prefix} ${suffix}`;
  const sector = SECTORS[index % SECTORS.length];
  const price = Math.round((10 + rand() * 990) * 100) / 100;
  const change = Math.round((rand() * 10 - 5) * 100) / 100;
  const volume = `${(1 + rand() * 40).toFixed(1)}M`;
  return { symbol: `${symbol}${index}`.slice(0, 5), name, sector, price, change, volume };
}

let _cachedStocks: Stock[] | null = null;

export function getMockStocks(count = 200): Stock[] {
  if (_cachedStocks && _cachedStocks.length === count) return _cachedStocks;
  const stocks: Stock[] = [];
  const seen = new Set<string>();
  let i = 0;
  while (stocks.length < count) {
    const s = buildStock(i);
    if (!seen.has(s.symbol)) {
      seen.add(s.symbol);
      stocks.push(s);
    }
    i++;
  }
  _cachedStocks = stocks;
  return stocks;
}

export function findStock(symbol: string): Stock | undefined {
  return getMockStocks().find((s) => s.symbol.toLowerCase() === symbol.toLowerCase());
}

const SUMMARY_TEMPLATES = [
  (name: string, sector: string) =>
    `${name} designs and delivers ${sector.toLowerCase()} solutions for enterprise and consumer markets, with a focus on scalable infrastructure and long-term recurring revenue.`,
  (name: string, sector: string) =>
    `${name} operates across the ${sector.toLowerCase()} value chain, combining research-driven product development with a global distribution network.`,
  (name: string, sector: string) =>
    `Headquartered with operations spanning multiple regions, ${name} is a mid-to-large cap player in ${sector.toLowerCase()}, known for disciplined capital allocation.`,
];

export function getCompanyInfo(symbol: string): CompanyInfo | undefined {
  const stock = findStock(symbol);
  if (!stock) return undefined;
  const rand = mulberry32(hashString(symbol));
  const summary = SUMMARY_TEMPLATES[Math.floor(rand() * SUMMARY_TEMPLATES.length)](
    stock.name,
    stock.sector
  );
  const weekLow52 = Math.round(stock.price * (0.6 + rand() * 0.15) * 100) / 100;
  const weekHigh52 = Math.round(stock.price * (1.15 + rand() * 0.35) * 100) / 100;
  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    industry: `${stock.sector} \u2013 Diversified`,
    price: stock.price,
    change: stock.change,
    summary,
    peRatio: Math.round((8 + rand() * 45) * 10) / 10,
    marketCap: `$${(stock.price * (5 + rand() * 400)).toFixed(0)}M`,
    dividendYield: Math.round(rand() * 4.5 * 100) / 100,
    ebitda: `$${(20 + rand() * 900).toFixed(0)}M`,
    weekHigh52,
    weekLow52,
  };
}

const RANGE_DAYS: Record<ChartRange, number> = { "1M": 30, "6M": 182, "1Y": 365 };

export function getChartData(symbol: string, range: ChartRange): ChartPoint[] {
  const rand = mulberry32(hashString(symbol + range));
  const days = RANGE_DAYS[range];
  const stock = findStock(symbol);
  let price = stock ? stock.price * (0.82 + rand() * 0.15) : 100;
  const points: ChartPoint[] = [];
  const today = new Date();
  const step = Math.max(1, Math.floor(days / 60));
  for (let d = days; d >= 0; d -= step) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const drift = (rand() - 0.48) * (price * 0.025);
    price = Math.max(1, price + drift);
    points.push({
      date: date.toISOString().slice(0, 10),
      price: Math.round(price * 100) / 100,
    });
  }
  if (stock) points[points.length - 1].price = stock.price;
  return points;
}

export function getPrediction(symbol: string): Prediction | undefined {
  const stock = findStock(symbol);
  if (!stock) return undefined;
  const rand = mulberry32(hashString(symbol + "predict"));
  const expectedReturn = Math.round((rand() * 30 - 10) * 100) / 100;
  const confidence = Math.round(55 + rand() * 40);
  const riskScore = Math.round((1 + rand() * 9) * 10) / 10;
  const narrative =
    riskScore < 4
      ? "Stable historical volatility with consistent earnings support this lower-risk profile."
      : riskScore < 7
      ? "Moderate volatility driven by sector rotation and mixed macro signals."
      : "Elevated volatility and thinner analyst coverage point to a higher-risk, higher-dispersion outcome.";
  return {
    symbol: stock.symbol,
    expectedReturn,
    confidence,
    riskScore,
    horizon: "12-month",
    narrative,
  };
}
