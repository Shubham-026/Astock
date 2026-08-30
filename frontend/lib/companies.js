// ---- Shared mock universe -------------------------------------------------
// Kept as the single source of truth for both the landing page and the
// per-ticker detail page (previously duplicated across astock.html and
// astock_ticker.html).

export const COMPANIES = [
  {
    t: "AAPL",
    n: "Apple Inc.",
    p: 231.42,
    sector: "Technology",
    summary:
      "Designs, manufactures and sells consumer hardware — iPhone, Mac, iPad and wearables — bundled with a fast-growing services layer spanning the App Store, iCloud and subscriptions.",
  },
  {
    t: "MSFT",
    n: "Microsoft Corp.",
    p: 441.87,
    sector: "Technology",
    summary:
      "Enterprise software and cloud infrastructure giant behind Azure, Windows and Microsoft 365, with a growing footprint in AI copilots across its product suite.",
  },
  {
    t: "NVDA",
    n: "NVIDIA Corp.",
    p: 126.09,
    sector: "Semiconductors",
    summary:
      "Designs GPUs that power AI training and inference at data-center scale, alongside gaming graphics cards and accelerated-computing platforms.",
  },
  {
    t: "AMZN",
    n: "Amazon.com Inc.",
    p: 187.63,
    sector: "Consumer / Cloud",
    summary:
      "Global e-commerce and logistics network paired with AWS, the largest cloud infrastructure business, plus advertising and subscription arms.",
  },
  {
    t: "GOOGL",
    n: "Alphabet Inc. Class A",
    p: 172.14,
    sector: "Internet / AI",
    summary:
      "Parent of Google Search, YouTube and Google Cloud, monetizing attention through advertising while pushing AI models across its consumer and enterprise products.",
  },
  {
    t: "META",
    n: "Meta Platforms Inc.",
    p: 521.3,
    sector: "Internet / Social",
    summary:
      "Operates Facebook, Instagram and WhatsApp, monetizing a multi-billion user base through advertising while investing heavily in AI and mixed-reality hardware.",
  },
  {
    t: "TSLA",
    n: "Tesla Inc.",
    p: 214.77,
    sector: "Automotive / Energy",
    summary:
      "Designs and manufactures electric vehicles, battery storage and solar products, with growing bets on autonomy and robotics.",
  },
  {
    t: "AVGO",
    n: "Broadcom Inc.",
    p: 168.92,
    sector: "Semiconductors",
    summary:
      "Supplies networking chips, custom silicon and enterprise infrastructure software, with a large footprint in data-center and telecom hardware.",
  },
  {
    t: "JPM",
    n: "JPMorgan Chase & Co.",
    p: 213.55,
    sector: "Banking",
    summary:
      "The largest U.S. bank by assets, spanning consumer banking, investment banking, asset management and trading.",
  },
  {
    t: "V",
    n: "Visa Inc.",
    p: 279.41,
    sector: "Payments",
    summary:
      "Operates the world's largest card payments network, earning fees on transaction volume processed between banks, merchants and consumers.",
  },
  {
    t: "MA",
    n: "Mastercard Inc.",
    p: 481.2,
    sector: "Payments",
    summary:
      "Runs a global electronic payments network, licensing its rails to banks and processors while expanding into data and cybersecurity services.",
  },
  {
    t: "JNJ",
    n: "Johnson & Johnson",
    p: 154.08,
    sector: "Healthcare",
    summary:
      "Diversified healthcare company focused on pharmaceuticals and medical devices following the spin-off of its consumer health unit.",
  },
  {
    t: "WMT",
    n: "Walmart Inc.",
    p: 82.36,
    sector: "Retail",
    summary:
      "World's largest retailer by revenue, operating big-box stores and a rapidly growing e-commerce and advertising business.",
  },
  {
    t: "PG",
    n: "Procter & Gamble Co.",
    p: 167.94,
    sector: "Consumer Staples",
    summary:
      "Manufactures household and personal-care brands including Tide, Pampers and Gillette, sold across more than 180 countries.",
  },
  {
    t: "HD",
    n: "Home Depot Inc.",
    p: 389.11,
    sector: "Retail",
    summary:
      "Largest home-improvement retailer in the U.S., serving both DIY consumers and professional contractors.",
  },
  {
    t: "XOM",
    n: "Exxon Mobil Corp.",
    p: 117.62,
    sector: "Energy",
    summary:
      "Integrated oil and gas major spanning upstream production, refining and chemicals, with growing investment in carbon capture.",
  },
  {
    t: "CVX",
    n: "Chevron Corp.",
    p: 154.3,
    sector: "Energy",
    summary:
      "Integrated energy company engaged in oil and gas exploration, refining and a growing renewable-fuels segment.",
  },
  {
    t: "BAC",
    n: "Bank of America Corp.",
    p: 39.87,
    sector: "Banking",
    summary:
      "Major U.S. consumer and commercial bank with a large retail branch network and investment banking arm via BofA Securities.",
  },
  {
    t: "KO",
    n: "Coca\u2011Cola Co.",
    p: 63.21,
    sector: "Consumer Staples",
    summary:
      "Beverage company operating one of the most recognized brand portfolios in the world, distributed through a global bottling network.",
  },
  {
    t: "PEP",
    n: "PepsiCo Inc.",
    p: 171.05,
    sector: "Consumer Staples",
    summary:
      "Global food and beverage company behind Pepsi, Lay's, Gatorade and Quaker, spanning snacks and drinks.",
  },
  {
    t: "ADBE",
    n: "Adobe Inc.",
    p: 512.44,
    sector: "Software",
    summary:
      "Creative and marketing software company behind Photoshop, Premiere and the Creative Cloud subscription suite.",
  },
  {
    t: "CRM",
    n: "Salesforce Inc.",
    p: 298.6,
    sector: "Software",
    summary:
      "Cloud-based customer relationship management platform, extending into marketing, analytics and AI-driven agents for enterprises.",
  },
  {
    t: "NFLX",
    n: "Netflix Inc.",
    p: 684.93,
    sector: "Media / Streaming",
    summary:
      "Subscription video streaming service producing and licensing original and third-party content across more than 190 countries.",
  },
  {
    t: "INTC",
    n: "Intel Corp.",
    p: 23.14,
    sector: "Semiconductors",
    summary:
      "Designs and manufactures processors and chips, rebuilding its foundry business to compete in advanced semiconductor manufacturing.",
  },
  {
    t: "CSCO",
    n: "Cisco Systems Inc.",
    p: 56.78,
    sector: "Networking",
    summary:
      "Supplies networking hardware, software and security products that form the backbone of enterprise and internet infrastructure.",
  },
];

export function getCompany(ticker) {
  const upper = (ticker || "").toUpperCase();
  return COMPANIES.find((c) => c.t === upper) || null;
}

export function findMatch(query) {
  const q = (query || "").trim().toUpperCase();
  if (!q) return null;
  return (
    COMPANIES.find((c) => c.t === q) ||
    COMPANIES.find((c) => c.t.includes(q) || c.n.toUpperCase().includes(q)) ||
    null
  );
}

export function searchMatches(query, limit = 6) {
  const q = (query || "").trim().toUpperCase();
  if (!q) return [];
  return COMPANIES.filter(
    (c) => c.t.includes(q) || c.n.toUpperCase().includes(q)
  ).slice(0, limit);
}

export function initials(name) {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function fmtChg(v) {
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

// deterministic pseudo-random generator seeded per ticker so numbers
// stay stable across reloads (until the live tick loop nudges them)
export function seedFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
