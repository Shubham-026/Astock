import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Bell, Sun, Moon, TrendingUp, TrendingDown, ChevronRight, ChevronDown,
  Plus, X, Star, ArrowUpRight, ArrowDownRight, BarChart3, Home as HomeIcon,
  LineChart as LineChartIcon, SlidersHorizontal, Brain, Bookmark, Newspaper,
  GraduationCap, User, Menu, Sparkles, Info, ArrowRight, Check, Minus,
  Wallet, Clock, ExternalLink, ChevronUp, Filter
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from "recharts";

/* ============================================================
   ASTOCK — design tokens
   ============================================================ */
const DARK = {
  bg: "#090C10", bgAlt: "#0D1116", surface: "#12161D", surface2: "#171C24",
  border: "rgba(255,255,255,0.075)", borderStrong: "rgba(255,255,255,0.16)",
  text: "#EEF2F5", muted: "#8B96A4", faint: "#556070",
  up: "#22C983", upBg: "rgba(34,201,131,0.12)",
  down: "#F14B62", downBg: "rgba(241,75,98,0.12)",
  teal: "#22D9C4", tealBg: "rgba(34,217,196,0.10)",
  blue: "#4A7CFF", blueBg: "rgba(74,124,255,0.12)",
  overlay: "rgba(5,7,10,0.72)",
};
const LIGHT = {
  bg: "#F6F7F9", bgAlt: "#FFFFFF", surface: "#FFFFFF", surface2: "#F0F2F5",
  border: "rgba(11,16,22,0.09)", borderStrong: "rgba(11,16,22,0.18)",
  text: "#0E1318", muted: "#5A6472", faint: "#8A93A0",
  up: "#0E9F63", upBg: "rgba(14,159,99,0.10)",
  down: "#D6304A", downBg: "rgba(214,48,74,0.10)",
  teal: "#0EA99A", tealBg: "rgba(14,169,154,0.10)",
  blue: "#2E5FE0", blueBg: "rgba(46,95,224,0.10)",
  overlay: "rgba(20,24,30,0.5)",
};

const FONT_DISPLAY = "'Space Grotesk', 'Inter', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
.as-root * { box-sizing: border-box; }
.as-root { -webkit-font-smoothing: antialiased; }
.as-mono { font-family: ${FONT_MONO}; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.as-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
.as-scroll::-webkit-scrollbar-thumb { background: rgba(140,150,165,0.35); border-radius: 4px; }
.as-scroll::-webkit-scrollbar-track { background: transparent; }
@keyframes as-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.as-marquee-track { animation: as-marquee 38s linear infinite; }
.as-marquee-wrap:hover .as-marquee-track { animation-play-state: paused; }
@keyframes as-fade-up { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
.as-fade-up { animation: as-fade-up 0.5s cubic-bezier(.2,.7,.3,1) both; }
@keyframes as-toast-in { from { opacity:0; transform: translateY(8px) translateX(-50%);} to { opacity:1; transform: translateY(0) translateX(-50%);} }
.as-toast { animation: as-toast-in .25s ease both; }
.as-card-hover { transition: border-color .18s ease, transform .18s ease, background-color .18s ease; }
.as-card-hover:hover { transform: translateY(-2px); }
.as-btn { transition: opacity .15s ease, transform .1s ease, background-color .15s ease, border-color .15s ease; }
.as-btn:active { transform: scale(0.97); }
.as-tab-underline { transition: all .25s cubic-bezier(.2,.8,.3,1); }
.as-skel { background: linear-gradient(90deg, rgba(140,150,165,0.08) 25%, rgba(140,150,165,0.18) 37%, rgba(140,150,165,0.08) 63%); background-size: 400% 100%; animation: as-skel 1.4s ease infinite; }
@keyframes as-skel { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
.as-focus:focus-visible { outline: 2px solid #22D9C4; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .as-marquee-track, .as-fade-up, .as-toast, .as-skel { animation: none !important; } }
`;

/* ============================================================
   Deterministic mock-data generators
   ============================================================ */
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function genSeries(seedStr, base, points = 40, vol = 0.012) {
  const rand = mulberry32(hashStr(seedStr));
  let v = base;
  const arr = [];
  for (let i = 0; i < points; i++) {
    const drift = (rand() - 0.485) * vol * base;
    v = Math.max(v + drift, base * 0.55);
    arr.push({ i, v: Number(v.toFixed(2)) });
  }
  arr[arr.length - 1].v = base;
  return arr;
}
function fmtINR(n, decimals = 2) {
  if (n === undefined || n === null) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}
function fmtNum(n, decimals = 2) {
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}
function fmtCr(n) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L Cr";
  return "₹" + fmtNum(n, 0) + " Cr";
}
function fmtCompact(n) {
  if (Math.abs(n) >= 10000000) return (n / 10000000).toFixed(2) + "Cr";
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(2) + "L";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K";
  return fmtNum(n, 0);
}

/* ============================================================
   Mock market data
   ============================================================ */
const INDICES = [
  { id: "nifty50", name: "NIFTY 50", value: 24812.35, changePct: 0.76, category: "India" },
  { id: "sensex", name: "SENSEX", value: 81523.12, changePct: 0.76, category: "India" },
  { id: "banknifty", name: "BANK NIFTY", value: 51890.55, changePct: -0.27, category: "India" },
  { id: "niftyit", name: "NIFTY IT", value: 41230.9, changePct: 1.32, category: "India" },
  { id: "niftymidcap", name: "NIFTY MIDCAP 100", value: 57120.4, changePct: -0.15, category: "India" },
  { id: "niftyfin", name: "NIFTY FIN SERVICE", value: 24310.6, changePct: 0.41, category: "India" },
  { id: "nasdaq", name: "NASDAQ COMPOSITE", value: 19875.32, changePct: 0.57, category: "Global", unit: "$" },
  { id: "sp500", name: "S&P 500", value: 6412.8, changePct: -0.22, category: "Global", unit: "$" },
  { id: "dow", name: "DOW JONES", value: 42980.15, changePct: 0.21, category: "Global", unit: "$" },
  { id: "ftse", name: "FTSE 100", value: 8342.1, changePct: 0.18, category: "Global", unit: "£" },
  { id: "gold", name: "GOLD (MCX)", value: 73540, changePct: 0.29, category: "Commodities", unit: "₹/10g" },
  { id: "silver", name: "SILVER (MCX)", value: 89210, changePct: -0.44, category: "Commodities", unit: "₹/kg" },
  { id: "crude", name: "CRUDE OIL", value: 6845, changePct: 1.05, category: "Commodities", unit: "₹/bbl" },
  { id: "usdinr", name: "USD / INR", value: 87.14, changePct: 0.07, category: "Currencies" },
  { id: "eurinr", name: "EUR / INR", value: 94.62, changePct: -0.12, category: "Currencies" },
  { id: "gbpinr", name: "GBP / INR", value: 110.85, changePct: 0.09, category: "Currencies" },
  { id: "btc", name: "BTC / USD", value: 97250, changePct: -1.14, category: "Crypto", unit: "$" },
  { id: "eth", name: "ETH / USD", value: 3624, changePct: 2.31, category: "Crypto", unit: "$" },
].map((d) => ({ ...d, series: genSeries(d.id, d.value, 30, 0.01) }));

const SECTORS = ["IT", "Banking", "Energy", "FMCG", "Auto", "Pharma", "Finance", "Infra"];

const STOCKS = [
  { ticker: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy", price: 2984.6, changePct: 1.42, marketCap: 2021450, pe: 27.4, pb: 2.6, eps: 108.9, roe: 9.8, roce: 11.2, divYield: 0.4, debtEq: 0.42, volume: 8123400, high52: 3217.9, low52: 2221.0, rsi: 58, macd: "Bullish", sma20: 2940, sma50: 2870, sma200: 2650, support: 2890, resistance: 3050 },
  { ticker: "TCS", name: "Tata Consultancy Services", sector: "IT", price: 4152.15, changePct: 0.88, marketCap: 1503200, pe: 29.1, pb: 13.2, eps: 142.7, roe: 46.2, roce: 58.4, divYield: 1.6, debtEq: 0.02, volume: 2341200, high52: 4592.25, low52: 3565.0, rsi: 63, macd: "Bullish", sma20: 4090, sma50: 3980, sma200: 3820, support: 4020, resistance: 4260 },
  { ticker: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking", price: 1712.4, changePct: -0.34, marketCap: 1301800, pe: 19.8, pb: 2.9, eps: 86.5, roe: 15.9, roce: 8.1, divYield: 1.1, debtEq: 0.88, volume: 12432100, high52: 1880.0, low52: 1363.55, rsi: 44, macd: "Bearish", sma20: 1735, sma50: 1760, sma200: 1690, support: 1670, resistance: 1780 },
  { ticker: "INFY", name: "Infosys Ltd", sector: "IT", price: 1892.75, changePct: 1.61, marketCap: 785900, pe: 26.3, pb: 8.4, eps: 71.9, roe: 31.8, roce: 39.5, divYield: 2.1, debtEq: 0.03, volume: 5310800, high52: 2006.45, low52: 1358.35, rsi: 61, macd: "Bullish", sma20: 1855, sma50: 1790, sma200: 1680, support: 1820, resistance: 1950 },
  { ticker: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Banking", price: 1284.9, changePct: 0.52, marketCap: 903400, pe: 20.4, pb: 3.4, eps: 63.0, roe: 17.4, roce: 9.0, divYield: 0.8, debtEq: 0.91, volume: 9812000, high52: 1361.0, low52: 1023.6, rsi: 55, macd: "Bullish", sma20: 1265, sma50: 1220, sma200: 1160, support: 1240, resistance: 1320 },
  { ticker: "HINDUNILVR", name: "Hindustan Unilever Ltd", sector: "FMCG", price: 2456.3, changePct: -0.61, marketCap: 577200, pe: 51.2, pb: 10.8, eps: 48.0, roe: 21.1, roce: 27.6, divYield: 1.5, debtEq: 0.01, volume: 1543200, high52: 3035.0, low52: 2172.0, rsi: 39, macd: "Bearish", sma20: 2490, sma50: 2540, sma200: 2610, support: 2400, resistance: 2560 },
  { ticker: "ITC", name: "ITC Ltd", sector: "FMCG", price: 468.15, changePct: 0.29, marketCap: 585900, pe: 24.6, pb: 6.9, eps: 19.0, roe: 28.3, roce: 36.9, divYield: 3.2, debtEq: 0.0, volume: 15234000, high52: 528.0, low52: 401.6, rsi: 52, macd: "Neutral", sma20: 462, sma50: 455, sma200: 448, support: 450, resistance: 485 },
  { ticker: "SBIN", name: "State Bank of India", sector: "Banking", price: 812.55, changePct: -1.12, marketCap: 724700, pe: 10.8, pb: 1.6, eps: 75.2, roe: 17.2, roce: 7.4, divYield: 1.7, debtEq: 1.42, volume: 18432000, high52: 912.1, low52: 680.0, rsi: 41, macd: "Bearish", sma20: 828, sma50: 845, sma200: 810, support: 795, resistance: 850 },
  { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd", sector: "Infra", price: 1642.8, changePct: 2.05, marketCap: 989200, pe: 68.4, pb: 12.1, eps: 24.0, roe: 18.5, roce: 12.7, divYield: 0.4, debtEq: 1.65, volume: 6234000, high52: 1779.0, low52: 1101.0, rsi: 67, macd: "Bullish", sma20: 1590, sma50: 1520, sma200: 1420, support: 1560, resistance: 1700 },
  { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", price: 1785.2, changePct: 0.14, marketCap: 354800, pe: 18.9, pb: 2.7, eps: 94.5, roe: 14.6, roce: 7.9, divYield: 0.1, debtEq: 0.72, volume: 3120400, high52: 1953.0, low52: 1544.15, rsi: 49, macd: "Neutral", sma20: 1770, sma50: 1755, sma200: 1740, support: 1730, resistance: 1830 },
  { ticker: "LT", name: "Larsen & Toubro Ltd", sector: "Infra", price: 3542.9, changePct: 1.08, marketCap: 486700, pe: 33.2, pb: 4.8, eps: 106.7, roe: 14.9, roce: 13.8, divYield: 0.7, debtEq: 1.1, volume: 1834200, high52: 3948.7, low52: 3135.0, rsi: 59, macd: "Bullish", sma20: 3480, sma50: 3390, sma200: 3210, support: 3420, resistance: 3620 },
  { ticker: "ASIANPAINT", name: "Asian Paints Ltd", sector: "FMCG", price: 2312.4, changePct: -1.85, marketCap: 221700, pe: 44.6, pb: 12.9, eps: 51.8, roe: 29.9, roce: 39.1, divYield: 1.4, debtEq: 0.06, volume: 2145000, high52: 3422.95, low52: 2124.65, rsi: 32, macd: "Bearish", sma20: 2380, sma50: 2480, sma200: 2650, support: 2280, resistance: 2450 },
  { ticker: "MARUTI", name: "Maruti Suzuki India Ltd", sector: "Auto", price: 12845.5, changePct: 0.73, marketCap: 404100, pe: 27.8, pb: 4.2, eps: 462.1, roe: 15.6, roce: 19.4, divYield: 0.9, debtEq: 0.0, volume: 542300, high52: 13680.0, low52: 10405.55, rsi: 56, macd: "Bullish", sma20: 12600, sma50: 12100, sma200: 11550, support: 12300, resistance: 13100 },
  { ticker: "TITAN", name: "Titan Company Ltd", sector: "FMCG", price: 3421.75, changePct: 1.94, marketCap: 303500, pe: 88.3, pb: 22.4, eps: 38.8, roe: 26.1, roce: 24.5, divYield: 0.3, debtEq: 0.5, volume: 1245000, high52: 3885.0, low52: 3054.55, rsi: 64, macd: "Bullish", sma20: 3350, sma50: 3210, sma200: 3080, support: 3280, resistance: 3520 },
  { ticker: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Finance", price: 7182.3, changePct: -0.42, marketCap: 444700, pe: 31.5, pb: 5.9, eps: 228.0, roe: 19.9, roce: 13.1, divYield: 0.6, debtEq: 3.4, volume: 1832000, high52: 8192.0, low52: 6187.15, rsi: 46, macd: "Neutral", sma20: 7250, sma50: 7100, sma200: 6900, support: 6950, resistance: 7450 },
  { ticker: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Auto", price: 785.4, changePct: 3.12, marketCap: 289200, pe: 9.6, pb: 3.1, eps: 81.8, roe: 34.2, roce: 21.8, divYield: 0.3, debtEq: 0.95, volume: 21430000, high52: 1179.05, low52: 606.35, rsi: 71, macd: "Bullish", sma20: 745, sma50: 700, sma200: 680, support: 720, resistance: 810 },
].map((s) => ({
  ...s,
  series: genSeries(s.ticker, s.price, 60, 0.014),
  fundamentals: {
    years: ["FY21", "FY22", "FY23", "FY24", "FY25"],
    revenue: genSeries(s.ticker + "rev", s.marketCap * 0.00042, 5, 0.09).map((d) => Math.round(d.v)),
    netProfit: genSeries(s.ticker + "np", s.marketCap * 0.00006, 5, 0.14).map((d) => Math.round(d.v)),
    ebitdaMargin: genSeries(s.ticker + "eb", 22, 5, 0.1).map((d) => Number(d.v.toFixed(1))),
  },
}));

const NEWS = [
  { id: 1, cat: "Market", src: "Economic Times", time: "18 min ago", title: "Nifty 50 reclaims 24,800 as banking and IT stocks lead the rally", summary: "Broad-based buying across financials and technology counters pushed benchmark indices higher in afternoon trade, with FIIs turning net buyers for the third straight session." },
  { id: 2, cat: "Stocks", src: "Moneycontrol", time: "42 min ago", title: "Tata Motors surges 3% after strong domestic PV volume data", summary: "Shares extended gains after the company reported better-than-expected monthly dispatch numbers, with analysts flagging improving margins in the commercial vehicle segment." },
  { id: 3, cat: "IPO", src: "Livemint", time: "1 hr ago", title: "Two new mainboard IPOs to open for subscription next week", summary: "The issues, spanning specialty chemicals and financial services, are together looking to raise over ₹4,200 crore from primary markets amid strong retail appetite." },
  { id: 4, cat: "Economy", src: "Business Standard", time: "2 hr ago", title: "RBI likely to hold repo rate steady in upcoming policy review", summary: "Economists widely expect the central bank to maintain its current stance, citing sticky food inflation even as core inflation trends remain benign." },
  { id: 5, cat: "Global Markets", src: "Reuters", time: "3 hr ago", title: "Wall Street mixed as investors weigh Fed commentary on rate path", summary: "US indices traded in a narrow range overnight as traders parsed remarks from policymakers for clues on the timing of the next rate move." },
  { id: 6, cat: "Corporate", src: "CNBC-TV18", time: "4 hr ago", title: "Reliance Industries board approves capex plan for new energy business", summary: "The conglomerate's green energy arm is set to significantly scale up manufacturing capacity over the next three years as part of its diversification push." },
  { id: 7, cat: "Banking", src: "Financial Express", time: "5 hr ago", title: "Private banks report steady deposit growth in latest quarter", summary: "Sector-wide data pointed to a gradual narrowing of the credit-deposit gap, easing some of the funding cost pressure lenders have faced this year." },
  { id: 8, cat: "Technology", src: "Economic Times", time: "6 hr ago", title: "IT majors see early signs of demand recovery in BFSI vertical", summary: "Commentary from top software exporters suggests discretionary tech spending among banking clients is beginning to normalise after several soft quarters." },
  { id: 9, cat: "Market", src: "Moneycontrol", time: "7 hr ago", title: "Midcap and smallcap indices outperform benchmarks for second day", summary: "Broader markets extended their outperformance versus large caps, with breadth firmly positive across most sectoral indices." },
  { id: 10, cat: "Global Markets", src: "Bloomberg", time: "9 hr ago", title: "Asian markets track Wall Street gains ahead of key data releases", summary: "Regional indices opened firmer, taking cues from overnight US strength, with investors now turning attention to upcoming inflation prints." },
];

const LEARN_TOPICS = [
  { id: "basics", title: "Stock Market Basics", desc: "How markets work, exchanges, orders and settlement.", lessons: 12, progress: 75 },
  { id: "candles", title: "Candlestick Patterns", desc: "Read price action through classic candlestick formations.", lessons: 18, progress: 30 },
  { id: "technical", title: "Technical Analysis", desc: "Indicators, trendlines and chart-based decision making.", lessons: 22, progress: 45 },
  { id: "fundamental", title: "Fundamental Analysis", desc: "Reading balance sheets, ratios and business quality.", lessons: 20, progress: 10 },
  { id: "risk", title: "Risk Management", desc: "Position sizing, stop-loss discipline and capital protection.", lessons: 10, progress: 0 },
  { id: "portfolio", title: "Portfolio Management", desc: "Diversification, rebalancing and asset allocation.", lessons: 14, progress: 0 },
  { id: "options", title: "Options Basics", desc: "Calls, puts, premiums and simple hedging strategies.", lessons: 16, progress: 0 },
  { id: "mf", title: "Mutual Funds", desc: "SIPs, expense ratios and choosing the right fund category.", lessons: 9, progress: 60 },
  { id: "etf", title: "ETFs", desc: "Index tracking, liquidity and cost efficiency of ETFs.", lessons: 8, progress: 0 },
];

const SCREENER_PRESETS = ["Strong Fundamentals", "Growth Stocks", "Undervalued Stocks", "High Dividend", "Momentum Stocks", "Breakout Candidates", "Low Debt", "High ROE"];

function applyPreset(preset, stocks) {
  switch (preset) {
    case "Strong Fundamentals": return stocks.filter((s) => s.roe > 15 && s.debtEq < 1);
    case "Growth Stocks": return stocks.filter((s) => s.roe > 20);
    case "Undervalued Stocks": return stocks.filter((s) => s.pe < 25);
    case "High Dividend": return stocks.filter((s) => s.divYield > 1);
    case "Momentum Stocks": return stocks.filter((s) => s.rsi > 55 && s.changePct > 0);
    case "Breakout Candidates": return stocks.filter((s) => s.price > s.sma20 * 0.99 && s.rsi > 50);
    case "Low Debt": return stocks.filter((s) => s.debtEq < 0.5);
    case "High ROE": return stocks.filter((s) => s.roe > 20);
    default: return stocks;
  }
}

/* ============================================================
   Small shared UI atoms
   ============================================================ */
function ChangeTag({ pct, size = "sm", C }) {
  const up = pct >= 0;
  const pad = size === "sm" ? "2px 7px" : "4px 10px";
  const fs = size === "sm" ? 12 : 13;
  return (
    <span className="as-mono" style={{
      display: "inline-flex", alignItems: "center", gap: 3, padding: pad, borderRadius: 999,
      fontSize: fs, fontWeight: 600, color: up ? C.up : C.down, background: up ? C.upBg : C.downBg,
    }}>
      {up ? <ArrowUpRight size={size === "sm" ? 12 : 13} /> : <ArrowDownRight size={size === "sm" ? 12 : 13} />}
      {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

function Sparkline({ data, up, C, height = 44 }) {
  const color = up ? C.up : C.down;
  const gid = "spk" + Math.random().toString(36).slice(2, 9);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${gid})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SectionHeading({ eyebrow, title, action, C }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div className="as-mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: C.teal, marginBottom: 6, textTransform: "uppercase" }}>{eyebrow}</div>}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 22, margin: 0, color: C.text }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function GhostButton({ children, onClick, C, active, small }) {
  return (
    <button onClick={onClick} className="as-btn as-focus" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: small ? "6px 12px" : "9px 16px", borderRadius: 10,
      background: active ? C.tealBg : "transparent", color: active ? C.teal : C.muted,
      border: `1px solid ${active ? "rgba(34,217,196,0.35)" : C.border}`,
      fontSize: small ? 12.5 : 13.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
    }}>{children}</button>
  );
}

function PrimaryButton({ children, onClick, C, icon: Icon, style }) {
  return (
    <button onClick={onClick} className="as-btn as-focus" style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10,
      background: C.teal, color: "#04120F", border: "none", fontWeight: 700, fontSize: 14,
      cursor: "pointer", fontFamily: FONT_BODY, ...style,
    }}>{Icon && <Icon size={16} />}{children}</button>
  );
}

function Card({ children, C, style, hover = true }) {
  return (
    <div className={hover ? "as-card-hover" : ""} style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, ...style,
    }}>{children}</div>
  );
}

/* ============================================================
   Ticker tape (signature terminal element)
   ============================================================ */
function TickerTape({ C, indices, onPick }) {
  const items = [...indices, ...indices];
  return (
    <div className="as-marquee-wrap" style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}`, overflow: "hidden", position: "relative" }}>
      <div className="as-marquee-track" style={{ display: "flex", width: "max-content", padding: "8px 0" }}>
        {items.map((d, idx) => (
          <button key={idx} onClick={() => onPick && onPick(d)} className="as-mono as-focus" style={{
            display: "flex", alignItems: "center", gap: 8, padding: "0 20px", background: "none", border: "none",
            borderRight: `1px solid ${C.border}`, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>{d.name}</span>
            <span style={{ color: C.text, fontSize: 12 }}>{d.unit && d.unit !== "$" ? d.unit + " " : d.unit === "$" ? "$" : "₹"}{fmtNum(d.value, d.value > 10000 ? 0 : 2)}</span>
            <span style={{ color: d.changePct >= 0 ? C.up : C.down, fontSize: 12, fontWeight: 600 }}>
              {d.changePct >= 0 ? "▲" : "▼"} {Math.abs(d.changePct).toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Header / Navigation
   ============================================================ */
function Logo({ C, size = 26 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="1" y="1" width="38" height="38" rx="10" stroke={C.teal} strokeWidth="1.6" />
        <path d="M9 26L16.5 17L22 22.5L31 12" stroke={C.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24.5 12H31V18.5" stroke={C.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: size * 0.72, letterSpacing: "0.01em", color: C.text }}>ASTOCK</span>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "markets", label: "Markets" },
  { id: "stock", label: "Stocks" },
  { id: "screener", label: "Screener" },
  { id: "analysis", label: "Analysis", dropdown: [{ id: "technical", label: "Technical Analysis" }, { id: "fundamental", label: "Fundamental Analysis" }] },
  { id: "ai", label: "AI Analysis" },
  { id: "watchlist", label: "Watchlist" },
  { id: "news", label: "News" },
  { id: "learn", label: "Learn" },
];

function Header({ C, isDark, setIsDark, view, navigate, onSearch, mobileOpen, setMobileOpen, onLogin }) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const query = q.toLowerCase();
    return STOCKS.filter((s) => s.ticker.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)).slice(0, 6);
  }, [q]);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: C.bg + "F2", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", height: 64, gap: 20 }}>
        <button onClick={() => navigate("home")} className="as-focus" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Logo C={C} />
        </button>

        <nav className="as-scroll" style={{ display: "none", alignItems: "center", gap: 2 }}>
          {NAV_ITEMS.map((n) => (
            <div key={n.id} style={{ position: "relative" }}
              onMouseEnter={() => n.dropdown && setAnalysisOpen(true)}
              onMouseLeave={() => n.dropdown && setAnalysisOpen(false)}>
              <button onClick={() => (n.dropdown ? null : navigate(n.id))} className="as-btn as-focus" style={{
                display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer",
                padding: "8px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, fontFamily: FONT_BODY,
                color: view === n.id || (n.dropdown && n.dropdown.some((d) => d.id === view)) ? C.text : C.muted,
              }}>
                {n.label}{n.dropdown && <ChevronDown size={13} />}
              </button>
              {n.dropdown && analysisOpen && (
                <div className="as-fade-up" style={{ position: "absolute", top: "100%", left: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, minWidth: 200, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}>
                  {n.dropdown.map((d) => (
                    <button key={d.id} onClick={() => { navigate("stock", { tab: d.id }); setAnalysisOpen(false); }} className="as-focus" style={{
                      display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
                      padding: "9px 12px", borderRadius: 8, fontSize: 13, color: C.text, fontFamily: FONT_BODY,
                    }}>{d.label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative", display: "none" }} id="as-desktop-search">
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", width: 260 }}>
            <Search size={15} color={C.faint} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stocks, sectors…"
              className="as-focus" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, width: "100%", fontFamily: FONT_BODY }} />
          </div>
          {results.length > 0 && (
            <div className="as-fade-up" style={{ position: "absolute", top: "110%", right: 0, width: 320, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, boxShadow: "0 14px 34px rgba(0,0,0,0.4)", zIndex: 50 }}>
              {results.map((s) => (
                <button key={s.ticker} onClick={() => { onSearch(s.ticker); setQ(""); }} className="as-focus" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none",
                  cursor: "pointer", padding: "9px 10px", borderRadius: 8, fontFamily: FONT_BODY,
                }}>
                  <span style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.ticker}</div>
                    <div style={{ fontSize: 11.5, color: C.faint }}>{s.name}</div>
                  </span>
                  <span className="as-mono" style={{ fontSize: 12.5, color: C.text }}>{fmtINR(s.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="as-btn as-focus" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>
          <Bell size={16} />
        </button>
        <button onClick={() => setIsDark(!isDark)} className="as-btn as-focus" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div style={{ display: "none", alignItems: "center", gap: 10 }} id="as-auth-btns">
          <button onClick={onLogin} className="as-btn as-focus" style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontWeight: 600, fontSize: 13.5, fontFamily: FONT_BODY }}>Log in</button>
          <PrimaryButton C={C} onClick={onLogin}>Sign up</PrimaryButton>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="as-focus" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text }}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          header nav { display: flex !important; }
          #as-desktop-search { display: block !important; }
          #as-auth-btns { display: flex !important; }
          header > div > button[style*="width: 38px"] { display: none !important; }
        }
        @media (min-width: 640px) {
          header > div > button[style*="width: 36px"] { display: flex !important; }
        }
      `}</style>

      {mobileOpen && (
        <div className="as-fade-up as-scroll" style={{ borderTop: `1px solid ${C.border}`, maxHeight: "70vh", overflowY: "auto", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <Search size={15} color={C.faint} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stocks…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 14, width: "100%", fontFamily: FONT_BODY }} />
          </div>
          {results.map((s) => (
            <button key={s.ticker} onClick={() => { onSearch(s.ticker); setQ(""); setMobileOpen(false); }} style={{ display: "flex", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: "9px 6px", color: C.text, fontFamily: FONT_BODY }}>
              <span>{s.ticker}</span><span className="as-mono">{fmtINR(s.price)}</span>
            </button>
          ))}
          {NAV_ITEMS.flatMap((n) => (n.dropdown ? n.dropdown.map((d) => ({ id: "stock", label: d.label, tab: d.id })) : [n])).map((n, i) => (
            <button key={i} onClick={() => { navigate(n.id, n.tab ? { tab: n.tab } : undefined); setMobileOpen(false); }} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", background: "none", border: "none",
              borderTop: `1px solid ${C.border}`, padding: "13px 6px", color: C.text, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
            }}>{n.label}<ChevronRight size={15} color={C.faint} /></button>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <GhostButton C={C} onClick={onLogin}>Log in</GhostButton>
            <PrimaryButton C={C} onClick={onLogin} style={{ flex: 1, justifyContent: "center" }}>Sign up</PrimaryButton>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileBottomNav({ C, view, navigate }) {
  const items = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "markets", label: "Markets", icon: BarChart3 },
    { id: "screener", label: "Search", icon: Search },
    { id: "watchlist", label: "Watchlist", icon: Bookmark },
    { id: "profile", label: "Profile", icon: User },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, display: "flex", background: C.bgAlt + "F5",
      backdropFilter: "blur(10px)", borderTop: `1px solid ${C.border}`, padding: "6px 4px calc(6px + env(safe-area-inset-bottom))",
    }} id="as-bottom-nav">
      {items.map((it) => {
        const active = view === it.id;
        return (
          <button key={it.id} onClick={() => navigate(it.id === "profile" ? "home" : it.id)} className="as-focus" style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0",
            background: "none", border: "none", cursor: "pointer", color: active ? C.teal : C.faint,
          }}>
            <it.icon size={19} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: 600, fontFamily: FONT_BODY }}>{it.label}</span>
          </button>
        );
      })}
      <style>{`@media (min-width: 1024px) { #as-bottom-nav { display: none !important; } }`}</style>
    </div>
  );
}

/* ============================================================
   HOME VIEW
   ============================================================ */
function HomeView({ C, navigate, watchlistTickers, addToWatchlist }) {
  const gainers = [...STOCKS].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...STOCKS].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  const trending = [...STOCKS].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const heroIdx = INDICES[0];

  return (
    <div>
      {/* Hero */}
      <section style={{ borderBottom: `1px solid ${C.border}`, background: `linear-gradient(180deg, ${C.bgAlt}, ${C.bg})` }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "56px 20px 40px", display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 480px", minWidth: 300 }}>
            <div className="as-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.teal, background: C.tealBg, padding: "6px 12px", borderRadius: 999, marginBottom: 20, letterSpacing: "0.06em" }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} />
              NSE / BSE LIVE-STYLE DEMO DATA
            </div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.08, margin: "0 0 18px", color: C.text, letterSpacing: "-0.01em" }}>
              Understand the Market.<br />Analyse Smarter.
            </h1>
            <p style={{ color: C.muted, fontSize: 16.5, lineHeight: 1.6, maxWidth: 480, marginBottom: 28 }}>
              AI-powered stock research, technical analysis and market intelligence for Indian equities — all in one platform.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <PrimaryButton C={C} icon={Sparkles} onClick={() => navigate("ai")}>Start Analysing</PrimaryButton>
              <GhostButton C={C} onClick={() => navigate("markets")}>Explore Markets <ArrowRight size={14} style={{ marginLeft: 2 }} /></GhostButton>
            </div>
          </div>

          <Card C={C} style={{ flex: "1 1 340px", minWidth: 300, padding: 22, maxWidth: 420 }} hover={false}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 4 }}>{heroIdx.name}</div>
                <div className="as-mono" style={{ fontSize: 30, fontWeight: 700, color: C.text }}>{fmtNum(heroIdx.value, 2)}</div>
              </div>
              <ChangeTag pct={heroIdx.changePct} C={C} size="md" />
            </div>
            <div style={{ height: 90, margin: "8px -6px 4px" }}>
              <Sparkline data={heroIdx.series} up={heroIdx.changePct >= 0} C={C} height={90} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.faint, fontFamily: FONT_MONO }}>
              <span>09:15</span><span>12:00</span><span>15:30 IST</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Live index cards */}
      <section style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 20px 8px" }}>
        <SectionHeading eyebrow="Live Snapshot" title="Key Indices" C={C} action={<GhostButton C={C} small onClick={() => navigate("markets")}>View all markets <ChevronRight size={13} /></GhostButton>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {INDICES.slice(0, 5).map((d) => (
            <Card key={d.id} C={C} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, letterSpacing: "0.01em" }}>{d.name}</div>
                <ChangeTag pct={d.changePct} C={C} />
              </div>
              <div className="as-mono" style={{ fontSize: 21, fontWeight: 700, color: C.text, margin: "8px 0 4px" }}>{fmtNum(d.value, 2)}</div>
              <div style={{ height: 42, margin: "0 -4px" }}><Sparkline data={d.series} up={d.changePct >= 0} C={C} /></div>
            </Card>
          ))}
        </div>
      </section>

      {/* Gainers / Losers / Trending */}
      <section style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 20px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <StockRankCard title="Top Gainers" list={gainers} C={C} navigate={navigate} kind="up" />
          <StockRankCard title="Top Losers" list={losers} C={C} navigate={navigate} kind="down" />
          <StockRankCard title="Trending by Volume" list={trending} C={C} navigate={navigate} kind="vol" />
        </div>
      </section>

      {/* AI insights + Watchlist + News */}
      <section style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }} id="as-home-grid">
          <Card C={C} style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.tealBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Brain size={17} color={C.teal} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: C.text, fontFamily: FONT_DISPLAY }}>ASTOCK AI Insight of the Day</div>
            </div>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.65, marginBottom: 16 }}>
              Banking and IT sectors are showing renewed relative strength this week, with breadth improving across large-cap financials. Momentum indicators on the Bank Nifty remain constructive above the 20-day average, while broader mid-cap participation has cooled slightly — a pattern worth watching for signs of sector rotation.
            </p>
            <GhostButton C={C} onClick={() => navigate("ai")}>Ask ASTOCK AI <ArrowRight size={13} /></GhostButton>
          </Card>
          <Card C={C} style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: C.text, fontFamily: FONT_DISPLAY }}>Your Watchlist</div>
              <GhostButton C={C} small onClick={() => navigate("watchlist")}>Manage</GhostButton>
            </div>
            {watchlistTickers.length === 0 && <EmptyState C={C} text="No stocks added yet." />}
            {watchlistTickers.slice(0, 4).map((t) => {
              const s = STOCKS.find((x) => x.ticker === t);
              if (!s) return null;
              return (
                <button key={t} onClick={() => navigate("stock", { ticker: t })} className="as-focus" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none",
                  borderTop: `1px solid ${C.border}`, padding: "10px 2px", cursor: "pointer", fontFamily: FONT_BODY,
                }}>
                  <span style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{s.ticker}</div>
                    <div style={{ fontSize: 11, color: C.faint }}>{s.sector}</div>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <div className="as-mono" style={{ fontSize: 13, color: C.text }}>{fmtINR(s.price)}</div>
                    <ChangeTag pct={s.changePct} C={C} />
                  </span>
                </button>
              );
            })}
          </Card>
        </div>
        <style>{`@media (max-width: 860px) { #as-home-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>
    </div>
  );
}

function StockRankCard({ title, list, C, navigate, kind }) {
  return (
    <Card C={C} style={{ padding: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 14.5, color: C.text, marginBottom: 12, fontFamily: FONT_DISPLAY }}>{title}</div>
      {list.map((s, i) => (
        <button key={s.ticker} onClick={() => navigate("stock", { ticker: s.ticker })} className="as-focus" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none",
          padding: "8px 2px", borderTop: i === 0 ? "none" : `1px solid ${C.border}`, cursor: "pointer", fontFamily: FONT_BODY,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
            <span className="as-mono" style={{ fontSize: 11, color: C.faint, width: 16 }}>{i + 1}</span>
            <span>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.ticker}</div>
              <div style={{ fontSize: 10.5, color: C.faint }}>{s.sector}</div>
            </span>
          </span>
          <span style={{ textAlign: "right" }}>
            <div className="as-mono" style={{ fontSize: 12.5, color: C.text }}>{fmtINR(s.price)}</div>
            {kind === "vol" ? <span className="as-mono" style={{ fontSize: 11, color: C.faint }}>{fmtCompact(s.volume)}</span> : <ChangeTag pct={s.changePct} C={C} />}
          </span>
        </button>
      ))}
    </Card>
  );
}

function EmptyState({ C, text, sub, icon: Icon = Bookmark }) {
  return (
    <div style={{ textAlign: "center", padding: "34px 10px", color: C.faint }}>
      <Icon size={26} style={{ marginBottom: 10, opacity: 0.6 }} />
      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.muted }}>{text}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ============================================================
   MARKETS VIEW
   ============================================================ */
function MarketsView({ C, navigate }) {
  const [cat, setCat] = useState("India");
  const cats = ["India", "Global", "Commodities", "Currencies", "Crypto"];
  const filtered = INDICES.filter((d) => d.category === cat);
  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 20px 80px" }}>
      <SectionHeading eyebrow="Overview" title="Market Overview" C={C} />
      <div className="as-scroll" style={{ display: "flex", gap: 8, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
        {cats.map((c) => <GhostButton key={c} C={C} active={cat === c} onClick={() => setCat(c)}>{c}</GhostButton>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {filtered.map((d) => (
          <Card key={d.id} C={C} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.name}</div>
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{d.category}</div>
              </div>
              <ChangeTag pct={d.changePct} C={C} />
            </div>
            <div className="as-mono" style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "10px 0 6px" }}>
              {d.unit && d.unit !== "$" ? d.unit + " " : d.unit === "$" ? "$" : "₹"}{fmtNum(d.value, d.value > 10000 ? 0 : 2)}
            </div>
            <div style={{ height: 46, margin: "0 -4px" }}><Sparkline data={d.series} up={d.changePct >= 0} C={C} /></div>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <SectionHeading eyebrow="Equities" title="All Stocks" C={C} />
        <StocksTable C={C} stocks={STOCKS} navigate={navigate} />
      </div>
    </div>
  );
}

function StocksTable({ C, stocks, navigate, showAiScore }) {
  const [sortKey, setSortKey] = useState("marketCap");
  const [sortDir, setSortDir] = useState(-1);
  const sorted = useMemo(() => [...stocks].sort((a, b) => (a[sortKey] - b[sortKey]) * sortDir), [stocks, sortKey, sortDir]);
  const cols = [
    { key: "ticker", label: "Stock" },
    { key: "price", label: "Price", num: true },
    { key: "changePct", label: "Change", num: true },
    { key: "marketCap", label: "Mkt Cap", num: true },
    { key: "pe", label: "P/E", num: true },
    { key: "volume", label: "Volume", num: true },
  ];
  function toggleSort(k) { if (sortKey === k) setSortDir(-sortDir); else { setSortKey(k); setSortDir(-1); } }

  if (stocks.length === 0) return <Card C={C} style={{ padding: 0 }}><EmptyState C={C} icon={Filter} text="No stocks match these filters" sub="Try widening your screener criteria." /></Card>;

  return (
    <Card C={C} style={{ overflow: "hidden" }} hover={false}>
      <div className="as-scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{
                  textAlign: c.num ? "right" : "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.faint,
                  cursor: "pointer", userSelect: "none", borderBottom: `1px solid ${C.border}`, letterSpacing: "0.04em", whiteSpace: "nowrap",
                }}>{c.label}{sortKey === c.key && (sortDir === 1 ? " ↑" : " ↓")}</th>
              ))}
              {showAiScore && <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.faint, borderBottom: `1px solid ${C.border}` }}>AI Score</th>}
              <th style={{ borderBottom: `1px solid ${C.border}` }} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.ticker} onClick={() => navigate("stock", { ticker: s.ticker })} className="as-card-hover" style={{ cursor: "pointer" }}>
                <td style={{ padding: "13px 16px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{s.ticker}</div>
                  <div style={{ fontSize: 11, color: C.faint }}>{s.sector}</div>
                </td>
                <td className="as-mono" style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}` }}>{fmtINR(s.price)}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}><ChangeTag pct={s.changePct} C={C} /></td>
                <td className="as-mono" style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{fmtCr(s.marketCap)}</td>
                <td className="as-mono" style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{s.pe.toFixed(1)}</td>
                <td className="as-mono" style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{fmtCompact(s.volume)}</td>
                {showAiScore && <td style={{ padding: "13px 16px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}><AiScoreBadge s={s} C={C} /></td>}
                <td style={{ padding: "13px 16px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}><ChevronRight size={15} color={C.faint} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function aiScoreFor(s) {
  let score = 50;
  score += Math.min(20, s.roe / 2);
  score += s.pe < 25 ? 10 : -5;
  score += s.rsi > 50 && s.rsi < 70 ? 10 : 0;
  score += s.debtEq < 0.7 ? 8 : -6;
  score += s.changePct > 0 ? 5 : -3;
  return Math.max(1, Math.min(99, Math.round(score)));
}
function AiScoreBadge({ s, C }) {
  const score = aiScoreFor(s);
  const color = score >= 70 ? C.up : score >= 45 ? C.teal : C.down;
  return <span className="as-mono" style={{ fontSize: 12.5, fontWeight: 700, color }}>{score}</span>;
}

/* ============================================================
   STOCK DETAIL VIEW
   ============================================================ */
const TIMEFRAMES = ["1D", "1W", "1M", "6M", "1Y", "5Y", "MAX"];

function StockView({ C, ticker, setTicker, tab, setTab, addToWatchlist, isWatchlisted, showToast, navigate }) {
  const s = STOCKS.find((x) => x.ticker === ticker) || STOCKS[0];
  const [timeframe, setTimeframe] = useState("1M");
  const [chartType, setChartType] = useState("area");
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareTicker, setCompareTicker] = useState("TCS");
  const pointsFor = { "1D": 24, "1W": 42, "1M": 60, "6M": 90, "1Y": 120, "5Y": 150, MAX: 180 };
  const series = useMemo(() => genSeries(s.ticker + timeframe, s.price, pointsFor[timeframe], 0.014), [s.ticker, timeframe]);
  const volumeSeries = useMemo(() => genSeries(s.ticker + timeframe + "vol", 100, pointsFor[timeframe], 0.5).map((d) => ({ i: d.i, v: Math.abs(d.v) })), [s.ticker, timeframe]);
  const cmp = STOCKS.find((x) => x.ticker === compareTicker);

  const tabs = [{ id: "overview", label: "Overview" }, { id: "technical", label: "Technical" }, { id: "fundamental", label: "Fundamental" }, { id: "ai", label: "AI Analysis" }];

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "30px 20px 90px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span className="as-mono" style={{ fontSize: 12, color: C.faint, background: C.surface2, padding: "3px 9px", borderRadius: 6 }}>{s.ticker}</span>
            <span style={{ fontSize: 11.5, color: C.muted }}>{s.sector}</span>
            <span className="as-mono" style={{ fontSize: 11, color: C.up, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: C.up, display: "inline-block" }} />Market Open</span>
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, margin: "0 0 8px", color: C.text }}>{s.name}</h1>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span className="as-mono" style={{ fontSize: 30, fontWeight: 700, color: C.text }}>{fmtINR(s.price)}</span>
            <ChangeTag pct={s.changePct} C={C} size="md" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <GhostButton C={C} active={isWatchlisted(s.ticker)} onClick={() => { addToWatchlist(s.ticker); showToast(isWatchlisted(s.ticker) ? `Removed ${s.ticker} from watchlist` : `Added ${s.ticker} to watchlist`); }}>
            <Bookmark size={14} fill={isWatchlisted(s.ticker) ? C.teal : "none"} /> Watchlist
          </GhostButton>
          <GhostButton C={C} active={compareOpen} onClick={() => setCompareOpen(!compareOpen)}><SlidersHorizontal size={14} /> Compare</GhostButton>
          <PrimaryButton C={C} icon={Brain} onClick={() => setTab("ai")}>AI Analysis</PrimaryButton>
        </div>
      </div>

      {compareOpen && (
        <Card C={C} style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Compare {s.ticker} vs</div>
            <select value={compareTicker} onChange={(e) => setCompareTicker(e.target.value)} style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, fontFamily: FONT_BODY }}>
              {STOCKS.filter((x) => x.ticker !== s.ticker).map((x) => <option key={x.ticker} value={x.ticker}>{x.ticker}</option>)}
            </select>
          </div>
          {cmp && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[s, cmp].map((st) => (
                <div key={st.ticker}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{st.ticker}</div>
                  {[["Price", fmtINR(st.price)], ["Change", st.changePct.toFixed(2) + "%"], ["P/E", st.pe.toFixed(1)], ["ROE", st.roe.toFixed(1) + "%"], ["Mkt Cap", fmtCr(st.marketCap)], ["Div Yield", st.divYield.toFixed(1) + "%"]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: 12.5 }}>
                      <span style={{ color: C.faint }}>{l}</span><span className="as-mono" style={{ color: C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="as-focus" style={{
            background: "none", border: "none", cursor: "pointer", padding: "10px 16px", fontSize: 13.5, fontWeight: 600,
            color: tab === t.id ? C.text : C.faint, borderBottom: `2px solid ${tab === t.id ? C.teal : "transparent"}`, fontFamily: FONT_BODY,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }} id="as-stock-grid">
          <Card C={C} style={{ padding: 20 }} hover={false}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {TIMEFRAMES.map((tf) => <GhostButton key={tf} C={C} small active={timeframe === tf} onClick={() => setTimeframe(tf)}>{tf}</GhostButton>)}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <GhostButton C={C} small active={chartType === "area"} onClick={() => setChartType("area")}>Line</GhostButton>
                <GhostButton C={C} small active={chartType === "candle"} onClick={() => setChartType("candle")}>Candlestick</GhostButton>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={series} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <defs><linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={0.28} /><stop offset="100%" stopColor={C.teal} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid stroke={C.border} vertical={false} />
                    <XAxis dataKey="i" tick={{ fontSize: 10, fill: C.faint }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.faint }} formatter={(v) => [fmtINR(v), "Price"]} />
                    <ReferenceLine y={s.support} stroke={C.down} strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={s.resistance} stroke={C.up} strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Area type="monotone" dataKey="v" stroke={C.teal} strokeWidth={2} fill="url(#stockGrad)" isAnimationActive={false} dot={false} />
                  </AreaChart>
                ) : (
                  <BarChart data={series} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={C.border} vertical={false} />
                    <XAxis dataKey="i" tick={{ fontSize: 10, fill: C.faint }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtINR(v), "Price"]} />
                    <Bar dataKey="v" fill={C.teal} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <div style={{ height: 70, marginTop: 6 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeSeries} margin={{ top: 0, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="i" hide /><YAxis hide />
                  <Bar dataKey="v" fill={C.faint} opacity={0.4} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: "center", fontSize: 10.5, color: C.faint, marginTop: -4 }}>Volume</div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card C={C} style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 12 }}>Key Stats</div>
              {[["Market Cap", fmtCr(s.marketCap)], ["P/E Ratio", s.pe.toFixed(1)], ["52W High", fmtINR(s.high52)], ["52W Low", fmtINR(s.low52)], ["Volume", fmtCompact(s.volume)], ["Div Yield", s.divYield.toFixed(1) + "%"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12.5, color: C.muted }}>{l}</span><span className="as-mono" style={{ fontSize: 12.5, color: C.text }}>{v}</span>
                </div>
              ))}
            </Card>
            <Card C={C} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>ASTOCK AI Score</span>
                <AiScoreBadge s={s} C={C} />
              </div>
              <div style={{ height: 6, background: C.surface2, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${aiScoreFor(s)}%`, height: "100%", background: C.teal }} />
              </div>
              <p style={{ fontSize: 12, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>Composite of valuation, momentum and quality factors. Not a recommendation.</p>
            </Card>
          </div>
        </div>
      )}

      {tab === "technical" && <TechnicalTab s={s} C={C} />}
      {tab === "fundamental" && <FundamentalTab s={s} C={C} />}
      {tab === "ai" && <StockAiTab s={s} C={C} />}

      <style>{`@media (max-width: 900px) { #as-stock-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function IndicatorCard({ label, value, tone, C }) {
  const color = tone === "up" ? C.up : tone === "down" ? C.down : C.text;
  return (
    <Card C={C} style={{ padding: 16 }}>
      <div style={{ fontSize: 11.5, color: C.faint, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div className="as-mono" style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </Card>
  );
}

function TechnicalTab({ s, C }) {
  const rsiTone = s.rsi > 70 ? "down" : s.rsi < 30 ? "up" : null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        <IndicatorCard C={C} label="RSI (14)" value={s.rsi} tone={rsiTone} />
        <IndicatorCard C={C} label="MACD Signal" value={s.macd} tone={s.macd === "Bullish" ? "up" : s.macd === "Bearish" ? "down" : null} />
        <IndicatorCard C={C} label="SMA 20" value={fmtINR(s.sma20, 0)} />
        <IndicatorCard C={C} label="SMA 50" value={fmtINR(s.sma50, 0)} />
        <IndicatorCard C={C} label="SMA 200" value={fmtINR(s.sma200, 0)} />
        <IndicatorCard C={C} label="EMA 20" value={fmtINR(s.sma20 * 1.004, 0)} />
        <IndicatorCard C={C} label="Bollinger Band" value={`${fmtINR(s.sma20 * 0.96, 0)} – ${fmtINR(s.sma20 * 1.04, 0)}`} />
        <IndicatorCard C={C} label="Support" value={fmtINR(s.support, 0)} tone="up" />
        <IndicatorCard C={C} label="Resistance" value={fmtINR(s.resistance, 0)} tone="down" />
      </div>
      <Card C={C} style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>RSI Trend (14-period)</div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={genSeries(s.ticker + "rsi", s.rsi, 40, 0.15).map((d) => ({ i: d.i, v: Math.max(5, Math.min(95, d.v)) }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="i" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} width={30} />
              <ReferenceLine y={70} stroke={C.down} strokeDasharray="3 3" strokeOpacity={0.6} />
              <ReferenceLine y={30} stroke={C.up} strokeDasharray="3 3" strokeOpacity={0.6} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="v" stroke={C.blue} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function FundamentalTab({ s, C }) {
  const f = s.fundamentals;
  const chartData = f.years.map((y, i) => ({ year: y, revenue: f.revenue[i], profit: f.netProfit[i] }));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16, marginBottom: 24 }}>
        <Card C={C} style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 12 }}>Valuation</div>
          {[["Market Cap", fmtCr(s.marketCap)], ["P/E Ratio", s.pe.toFixed(1)], ["P/B Ratio", s.pb.toFixed(1)], ["EPS", fmtINR(s.eps)], ["ROE", s.roe.toFixed(1) + "%"], ["ROCE", s.roce.toFixed(1) + "%"], ["Dividend Yield", s.divYield.toFixed(1) + "%"]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12.5, color: C.muted }}>{l}</span><span className="as-mono" style={{ fontSize: 12.5, color: C.text }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card C={C} style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 12 }}>Financials (TTM)</div>
          {[["Revenue", fmtCr(f.revenue[4])], ["EBITDA Margin", f.ebitdaMargin[4] + "%"], ["Net Profit", fmtCr(f.netProfit[4])], ["Profit Margin", ((f.netProfit[4] / f.revenue[4]) * 100).toFixed(1) + "%"], ["Debt / Equity", s.debtEq.toFixed(2)], ["Free Cash Flow", fmtCr(f.netProfit[4] * 0.8)]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12.5, color: C.muted }}>{l}</span><span className="as-mono" style={{ fontSize: 12.5, color: C.text }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card C={C} style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 12 }}>Growth (5Y CAGR est.)</div>
          {[["Revenue Growth", (((f.revenue[4] / f.revenue[0]) ** 0.25 - 1) * 100).toFixed(1) + "%"], ["Profit Growth", (((f.netProfit[4] / f.netProfit[0]) ** 0.25 - 1) * 100).toFixed(1) + "%"], ["EPS Growth", ((s.eps / (s.eps * 0.75) - 1) * 100).toFixed(1) + "%"]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12.5, color: C.muted }}>{l}</span><span className="as-mono" style={{ fontSize: 12.5, color: C.up }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card C={C} style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>Revenue vs Net Profit (₹ Cr)</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.faint }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill={C.blue} radius={[4, 4, 0, 0]} isAnimationActive={false} name="Revenue" />
              <Bar dataKey="profit" fill={C.teal} radius={[4, 4, 0, 0]} isAnimationActive={false} name="Net Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function buildAiAnalysis(s) {
  const trend = s.changePct >= 0 && s.rsi > 50 ? "Uptrend" : s.changePct < 0 && s.rsi < 50 ? "Downtrend" : "Sideways / Consolidating";
  const risk = s.pe > 45 || s.debtEq > 1.5 ? "Elevated" : s.pe > 25 ? "Moderate" : "Low-to-Moderate";
  const bullish = [];
  const bearish = [];
  if (s.roe > 18) bullish.push(`Strong return on equity of ${s.roe.toFixed(1)}% indicates efficient capital use.`);
  if (s.debtEq < 0.6) bullish.push("Healthy balance sheet with low debt relative to equity.");
  if (s.rsi > 50 && s.rsi < 70) bullish.push("Price momentum remains constructive without being overbought.");
  if (s.macd === "Bullish") bullish.push("MACD signal line confirms short-term bullish crossover.");
  if (bullish.length === 0) bullish.push("Valuation has moderated, which may attract value-conscious buyers.");
  if (s.pe > 35) bearish.push(`Valuation looks rich at ${s.pe.toFixed(1)}x earnings versus sector averages.`);
  if (s.rsi > 70) bearish.push("RSI in overbought territory, raising odds of a short-term pullback.");
  if (s.debtEq > 1.2) bearish.push("Relatively high leverage could pressure margins if rates stay elevated.");
  if (s.changePct < 0) bearish.push("Recent price action shows near-term selling pressure.");
  if (bearish.length === 0) bearish.push("Broader market volatility remains a general risk to monitor.");
  return { trend, risk, bullish: bullish.slice(0, 3), bearish: bearish.slice(0, 3) };
}

function AiAnalysisBlock({ s, C }) {
  const a = buildAiAnalysis(s);
  const Row = ({ label, children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, padding: "12px 0", borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
  return (
    <Card C={C} style={{ padding: 22 }} hover={false}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Brain size={17} color={C.teal} />
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: C.text }}>AI Market Summary — {s.ticker}</span>
      </div>
      <Row label="Trend">{a.trend}</Row>
      <Row label="Technical View">RSI at {s.rsi}, price trading {s.price > s.sma50 ? "above" : "below"} its 50-day average with MACD signalling {s.macd.toLowerCase()} momentum.</Row>
      <Row label="Fundamental View">Trading at {s.pe.toFixed(1)}x P/E with ROE of {s.roe.toFixed(1)}% and debt-to-equity of {s.debtEq.toFixed(2)}, {s.roe > 18 ? "reflecting efficient capital deployment" : "broadly in line with sector peers"}.</Row>
      <Row label="Risk Level"><span style={{ color: a.risk === "Elevated" ? C.down : a.risk === "Low-to-Moderate" ? C.up : C.text, fontWeight: 700 }}>{a.risk}</span></Row>
      <Row label="Key Support"><span className="as-mono">{fmtINR(s.support, 0)}</span></Row>
      <Row label="Key Resistance"><span className="as-mono">{fmtINR(s.resistance, 0)}</span></Row>
      <Row label="Bullish Factors"><ul style={{ margin: 0, paddingLeft: 18 }}>{a.bullish.map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}</ul></Row>
      <Row label="Bearish Factors"><ul style={{ margin: 0, paddingLeft: 18 }}>{a.bearish.map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}</ul></Row>
      <Row label="Overall Analysis">{s.ticker} currently reflects a {a.trend.toLowerCase()} with {a.risk.toLowerCase()} risk. This is a research summary generated from mock indicators, not a signal to buy or sell.</Row>
      <div style={{ marginTop: 16, padding: "12px 14px", background: C.surface2, borderRadius: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Info size={14} color={C.faint} style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>AI-generated insights are for research and educational purposes only and are not financial advice.</span>
      </div>
    </Card>
  );
}
function StockAiTab({ s, C }) { return <AiAnalysisBlock s={s} C={C} />; }

/* ============================================================
   SCREENER VIEW
   ============================================================ */
function ScreenerView({ C, navigate }) {
  const [preset, setPreset] = useState(null);
  const [sector, setSector] = useState("All");
  const [minRoe, setMinRoe] = useState(0);
  const [maxPe, setMaxPe] = useState(100);

  let result = preset ? applyPreset(preset, STOCKS) : STOCKS;
  result = result.filter((s) => (sector === "All" || s.sector === sector) && s.roe >= minRoe && s.pe <= maxPe);

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 20px 90px" }}>
      <SectionHeading eyebrow="Screener" title="Stock Screener" C={C} />
      <div className="as-scroll" style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {SCREENER_PRESETS.map((p) => <GhostButton key={p} C={C} active={preset === p} onClick={() => setPreset(preset === p ? null : p)}>{p}</GhostButton>)}
      </div>

      <Card C={C} style={{ padding: 18, marginBottom: 20 }} hover={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 18 }}>
          <div>
            <div style={{ fontSize: 11.5, color: C.faint, fontWeight: 600, marginBottom: 8 }}>SECTOR</div>
            <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ width: "100%", background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: FONT_BODY }}>
              <option>All</option>{SECTORS.map((sec) => <option key={sec}>{sec}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.faint, fontWeight: 600, marginBottom: 8 }}>MIN ROE — <span className="as-mono">{minRoe}%</span></div>
            <input type="range" min={0} max={40} value={minRoe} onChange={(e) => setMinRoe(Number(e.target.value))} style={{ width: "100%", accentColor: C.teal }} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.faint, fontWeight: 600, marginBottom: 8 }}>MAX P/E — <span className="as-mono">{maxPe}x</span></div>
            <input type="range" min={5} max={100} value={maxPe} onChange={(e) => setMaxPe(Number(e.target.value))} style={{ width: "100%", accentColor: C.teal }} />
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 12.5, color: C.faint, marginBottom: 12 }}>{result.length} stocks match your filters</div>
      <StocksTable C={C} stocks={result} navigate={navigate} showAiScore />
    </div>
  );
}

/* ============================================================
   AI ANALYSIS VIEW
   ============================================================ */
const AI_SUGGESTIONS = ["Analyse RELIANCE", "Is TCS overvalued?", "Explain today's market movement", "Compare TCS vs INFY", "Find fundamentally strong stocks", "Analyse technical setup for HDFCBANK"];

function findTickersInQuery(q) {
  const up = q.toUpperCase();
  return STOCKS.filter((s) => up.includes(s.ticker) || up.includes(s.name.toUpperCase().split(" ")[0]));
}

function AiAnalysisView({ C, navigate }) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);

  function runQuery(q) {
    if (!q.trim()) return;
    const found = findTickersInQuery(q);
    let response;
    if (/compare/i.test(q) && found.length >= 2) {
      response = { type: "compare", a: found[0], b: found[1] };
    } else if (/fundamentally strong|strong fundamentals/i.test(q)) {
      response = { type: "screen", list: applyPreset("Strong Fundamentals", STOCKS).slice(0, 6) };
    } else if (found.length >= 1) {
      response = { type: "single", s: found[0] };
    } else {
      response = { type: "fallback" };
    }
    setHistory((h) => [{ query: q, response }, ...h]);
    setQuery("");
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 16, background: C.tealBg, marginBottom: 16 }}>
          <Brain size={26} color={C.teal} />
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, margin: "0 0 8px", color: C.text }}>ASTOCK AI — Your Market Research Assistant</h1>
        <p style={{ color: C.muted, fontSize: 14.5, maxWidth: 520, margin: "0 auto" }}>Ask about any NSE-listed stock, compare companies, or screen for opportunities using natural language.</p>
      </div>

      <Card C={C} style={{ padding: 14 }} hover={false}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runQuery(query)}
            placeholder="Ask ASTOCK AI — e.g. Analyse RELIANCE, Compare TCS vs INFY…"
            className="as-focus" style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT_BODY }} />
          <PrimaryButton C={C} icon={Sparkles} onClick={() => runQuery(query)}>Analyse</PrimaryButton>
        </div>
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, marginBottom: 30 }}>
        {AI_SUGGESTIONS.map((sug) => <GhostButton key={sug} C={C} small onClick={() => runQuery(sug)}>{sug}</GhostButton>)}
      </div>

      {history.length === 0 && <EmptyState C={C} icon={Sparkles} text="Ask a question to get started" sub="Try one of the suggestions above." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {history.map((h, idx) => (
          <div key={idx} className="as-fade-up">
            <div style={{ fontSize: 13, color: C.faint, marginBottom: 10, fontStyle: "italic" }}>"{h.query}"</div>
            {h.response.type === "single" && <AiAnalysisBlock s={h.response.s} C={C} />}
            {h.response.type === "compare" && (
              <Card C={C} style={{ padding: 22 }} hover={false}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14, fontFamily: FONT_DISPLAY }}>{h.response.a.ticker} vs {h.response.b.ticker}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {[h.response.a, h.response.b].map((st) => (
                    <div key={st.ticker}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{st.ticker}</div>
                      {[["Price", fmtINR(st.price)], ["P/E", st.pe.toFixed(1)], ["ROE", st.roe.toFixed(1) + "%"], ["Debt/Eq", st.debtEq.toFixed(2)], ["RSI", st.rsi]].map(([l, v]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: 12.5 }}>
                          <span style={{ color: C.faint }}>{l}</span><span className="as-mono" style={{ color: C.text }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: C.muted, marginTop: 14, lineHeight: 1.6 }}>
                  {h.response.a.roe > h.response.b.roe ? h.response.a.ticker : h.response.b.ticker} shows stronger capital efficiency on ROE, while {h.response.a.pe < h.response.b.pe ? h.response.a.ticker : h.response.b.ticker} trades at a relatively cheaper valuation multiple.
                </p>
              </Card>
            )}
            {h.response.type === "screen" && (
              <Card C={C} style={{ padding: 0 }} hover={false}>
                <div style={{ padding: "16px 20px 4px", fontWeight: 700, fontSize: 14.5, color: C.text }}>Fundamentally Strong Stocks</div>
                <StocksTable C={C} stocks={h.response.list} navigate={navigate} showAiScore />
              </Card>
            )}
            {h.response.type === "fallback" && (
              <Card C={C} style={{ padding: 20 }} hover={false}>
                <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>I couldn't identify a specific stock in that question. Try naming a ticker directly, e.g. "Analyse RELIANCE" or "Compare HDFCBANK vs ICICIBANK".</p>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   WATCHLIST VIEW
   ============================================================ */
function WatchlistView({ C, navigate, watchlists, activeWatchlist, setActiveWatchlist, addToWatchlist, createWatchlist, isWatchlisted }) {
  const [newName, setNewName] = useState("");
  const tickers = watchlists[activeWatchlist] || [];
  const stocks = tickers.map((t) => STOCKS.find((s) => s.ticker === t)).filter(Boolean);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 90px" }}>
      <SectionHeading eyebrow="Portfolio" title="Watchlist" C={C} />
      <div className="as-scroll" style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4, alignItems: "center" }}>
        {Object.keys(watchlists).map((name) => <GhostButton key={name} C={C} active={activeWatchlist === name} onClick={() => setActiveWatchlist(name)}>{name} ({watchlists[name].length})</GhostButton>)}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New watchlist…" className="as-focus" style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12.5, color: C.text, width: 130, fontFamily: FONT_BODY }} />
          <button onClick={() => { if (newName.trim()) { createWatchlist(newName.trim()); setNewName(""); } }} className="as-btn as-focus" style={{ background: C.tealBg, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: C.teal, cursor: "pointer" }}><Plus size={16} /></button>
        </div>
      </div>

      {stocks.length === 0 ? (
        <Card C={C} style={{ padding: 0 }}><EmptyState C={C} text={`"${activeWatchlist}" is empty`} sub="Add stocks from any stock page or the screener." /></Card>
      ) : (
        <Card C={C} style={{ overflow: "hidden" }} hover={false}>
          <div className="as-scroll" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead><tr>{["Name", "Price", "Change", "Volume", "Mkt Cap", "Trend", "AI Score", ""].map((h, i) => (
                <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.faint, borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {stocks.map((s) => (
                  <tr key={s.ticker}>
                    <td onClick={() => navigate("stock", { ticker: s.ticker })} style={{ padding: "13px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{s.ticker}</div>
                      <div style={{ fontSize: 11, color: C.faint }}>{s.sector}</div>
                    </td>
                    <td className="as-mono" style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}` }}>{fmtINR(s.price)}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}><ChangeTag pct={s.changePct} C={C} /></td>
                    <td className="as-mono" style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{fmtCompact(s.volume)}</td>
                    <td className="as-mono" style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{fmtCr(s.marketCap)}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}>{s.changePct >= 0 ? <TrendingUp size={15} color={C.up} /> : <TrendingDown size={15} color={C.down} />}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}><AiScoreBadge s={s} C={C} /></td>
                    <td style={{ padding: "13px 16px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}>
                      <button onClick={() => addToWatchlist(s.ticker)} className="as-btn as-focus" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint }}><X size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   NEWS VIEW
   ============================================================ */
function NewsView({ C }) {
  const [cat, setCat] = useState("All");
  const cats = ["All", "Market", "Stocks", "Economy", "IPO", "Corporate", "Global Markets", "Technology", "Banking"];
  const filtered = cat === "All" ? NEWS : NEWS.filter((n) => n.cat === cat);
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 90px" }}>
      <SectionHeading eyebrow="Newsroom" title="Financial News" C={C} />
      <div className="as-scroll" style={{ display: "flex", gap: 8, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
        {cats.map((c) => <GhostButton key={c} C={C} small active={cat === c} onClick={() => setCat(c)}>{c}</GhostButton>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((n) => (
          <Card key={n.id} C={C} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <span className="as-mono" style={{ fontSize: 10.5, color: C.teal, background: C.tealBg, padding: "3px 9px", borderRadius: 6, fontWeight: 700 }}>{n.cat.toUpperCase()}</span>
              <span style={{ fontSize: 11.5, color: C.faint, display: "flex", alignItems: "center", gap: 5 }}><Clock size={11} />{n.time} · {n.src}</span>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text, marginBottom: 6, lineHeight: 1.35 }}>{n.title}</div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{n.summary}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   LEARN VIEW
   ============================================================ */
function LearnView({ C }) {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 20px 90px" }}>
      <SectionHeading eyebrow="Academy" title="Learn the Markets" C={C} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 16 }}>
        {LEARN_TOPICS.map((t) => (
          <Card key={t.id} C={C} style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: C.tealBg, marginBottom: 14 }}>
              <GraduationCap size={19} color={C.teal} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6, fontFamily: FONT_DISPLAY }}>{t.title}</div>
            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 16, minHeight: 38 }}>{t.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.faint, marginBottom: 6 }}>
              <span>{t.lessons} lessons</span><span>{t.progress}%</span>
            </div>
            <div style={{ height: 5, background: C.surface2, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${t.progress}%`, height: "100%", background: t.progress > 0 ? C.teal : C.faint }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Auth modal & Toast
   ============================================================ */
function AuthModal({ C, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="as-fade-up" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 30, width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Logo C={C} size={22} />
          <button onClick={onClose} className="as-focus" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint }}><X size={18} /></button>
        </div>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.text, margin: "0 0 4px" }}>Welcome back</h3>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Sign in to sync your watchlists and AI research history.</p>
        <input placeholder="Email address" className="as-focus" style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px", color: C.text, fontSize: 13.5, marginBottom: 10, fontFamily: FONT_BODY }} />
        <input placeholder="Password" type="password" className="as-focus" style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px", color: C.text, fontSize: 13.5, marginBottom: 16, fontFamily: FONT_BODY }} />
        <PrimaryButton C={C} onClick={onClose} style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}>Log in</PrimaryButton>
        <div style={{ textAlign: "center", fontSize: 12.5, color: C.faint }}>Don't have an account? <span style={{ color: C.teal, fontWeight: 600, cursor: "pointer" }}>Sign up</span></div>
      </div>
    </div>
  );
}

function Toast({ C, message }) {
  if (!message) return null;
  return (
    <div className="as-toast" style={{
      position: "fixed", bottom: 90, left: "50%", zIndex: 90, background: C.surface2, border: `1px solid ${C.borderStrong}`,
      color: C.text, padding: "11px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <Check size={15} color={C.teal} />{message}
    </div>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function Footer({ C, navigate }) {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, background: C.bgAlt, marginBottom: 56 }} id="as-footer">
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "44px 20px 30px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 30 }}>
        <div style={{ maxWidth: 280 }}>
          <Logo C={C} />
          <p style={{ fontSize: 12.5, color: C.faint, marginTop: 12, lineHeight: 1.6 }}>Analyse. Understand. Invest Smarter.</p>
        </div>
        <div style={{ display: "flex", gap: 50, flexWrap: "wrap" }}>
          <FooterCol C={C} title="Platform" items={[["Markets", "markets"], ["Screener", "screener"], ["AI Analysis", "ai"], ["Watchlist", "watchlist"]]} navigate={navigate} />
          <FooterCol C={C} title="Resources" items={[["News", "news"], ["Learn", "learn"]]} navigate={navigate} />
        </div>
      </div>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "16px 20px", borderTop: `1px solid ${C.border}`, fontSize: 11.5, color: C.faint }}>
        © 2026 ASTOCK. Market data shown is illustrative demo data for product preview purposes only.
      </div>
      <style>{`@media (max-width: 1023px) { #as-footer { margin-bottom: 64px; } }`}</style>
    </footer>
  );
}
function FooterCol({ C, title, items, navigate }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", marginBottom: 12 }}>{title.toUpperCase()}</div>
      {items.map(([label, id]) => <button key={id} onClick={() => navigate(id)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", padding: "5px 0", color: C.muted, fontSize: 13, fontFamily: FONT_BODY }}>{label}</button>)}
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
export default function ASTOCKApp() {
  const [isDark, setIsDark] = useState(true);
  const C = isDark ? DARK : LIGHT;
  const [view, setView] = useState("home");
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE");
  const [stockTab, setStockTab] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [watchlists, setWatchlists] = useState({ "My Watchlist": ["RELIANCE", "TCS", "INFY"] });
  const [activeWatchlist, setActiveWatchlist] = useState("My Watchlist");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2400); }

  function navigate(v, opts) {
    setView(v);
    if (opts && opts.ticker) setSelectedTicker(opts.ticker);
    if (opts && opts.tab) setStockTab(opts.tab);
    else if (v === "stock" && !opts) setStockTab("overview");
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function isWatchlisted(ticker) { return (watchlists[activeWatchlist] || []).includes(ticker); }
  function addToWatchlist(ticker) {
    setWatchlists((w) => {
      const list = w[activeWatchlist] || [];
      const next = list.includes(ticker) ? list.filter((t) => t !== ticker) : [...list, ticker];
      return { ...w, [activeWatchlist]: next };
    });
  }
  function createWatchlist(name) {
    setWatchlists((w) => ({ ...w, [name]: [] }));
    setActiveWatchlist(name);
  }

  const allWatchlistedTickers = watchlists[activeWatchlist] || [];

  return (
    <div className="as-root" style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT_BODY, transition: "background-color .2s ease" }}>
      <style>{GLOBAL_CSS}</style>

      <TickerTape C={C} indices={INDICES} onPick={() => navigate("markets")} />
      <Header C={C} isDark={isDark} setIsDark={setIsDark} view={view} navigate={navigate} onSearch={(t) => navigate("stock", { ticker: t })} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogin={() => setAuthOpen(true)} />

      <main>
        {view === "home" && <HomeView C={C} navigate={navigate} watchlistTickers={allWatchlistedTickers} addToWatchlist={addToWatchlist} />}
        {view === "markets" && <MarketsView C={C} navigate={navigate} />}
        {view === "stock" && <StockView C={C} ticker={selectedTicker} setTicker={setSelectedTicker} tab={stockTab} setTab={setStockTab} addToWatchlist={addToWatchlist} isWatchlisted={isWatchlisted} showToast={showToast} navigate={navigate} />}
        {view === "screener" && <ScreenerView C={C} navigate={navigate} />}
        {view === "ai" && <AiAnalysisView C={C} navigate={navigate} />}
        {view === "watchlist" && <WatchlistView C={C} navigate={navigate} watchlists={watchlists} activeWatchlist={activeWatchlist} setActiveWatchlist={setActiveWatchlist} addToWatchlist={addToWatchlist} createWatchlist={createWatchlist} isWatchlisted={isWatchlisted} />}
        {view === "news" && <NewsView C={C} />}
        {view === "learn" && <LearnView C={C} />}
      </main>

      <Footer C={C} navigate={navigate} />
      <MobileBottomNav C={C} view={view} navigate={navigate} />
      {authOpen && <AuthModal C={C} onClose={() => setAuthOpen(false)} />}
      <Toast C={C} message={toast} />
    </div>
  );
}