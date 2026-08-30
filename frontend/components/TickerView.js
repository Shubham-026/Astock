"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getChartSeries, jitterQuote } from "@/lib/mockData";
import { fmtChg, initials } from "@/lib/format";

const CHART_RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];
const QUOTE_POLL_MS = 2200;

function seriesToPaths(series) {
  const w = 640,
    h = 260,
    pad = 10;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (series.length - 1);
  const toY = (v) => h - pad - ((v - min) / span) * (h - pad * 2);

  const linePts = series
    .map((v, i) => `${(pad + i * stepX).toFixed(2)},${toY(v).toFixed(2)}`)
    .join(" ");
  const areaPts = `${pad},${h - pad} ${linePts} ${(
    pad +
    (series.length - 1) * stepX
  ).toFixed(2)},${h - pad}`;
  const up = series[series.length - 1] >= series[0];
  return { linePts, areaPts, up };
}

/**
 * @param {object} props
 * @param {object} props.company    { ticker, name, sector, summary, price, change }
 * @param {object} props.risk       shape documented in lib/mockData.js (getRisk)
 * @param {number[]} props.initialPrices  chart series for the default 1M range
 */
export default function TickerView({ company, risk, initialPrices }) {
  const router = useRouter();

  // ---- live header price, simulated locally instead of polling a backend --
  const [quote, setQuote] = useState({
    price: company.price,
    change: company.change,
  });

  useEffect(() => {
    setQuote({ price: company.price, change: company.change });

    const id = setInterval(() => {
      setQuote((prev) => jitterQuote(company.ticker, prev));
    }, QUOTE_POLL_MS);
    return () => clearInterval(id);
  }, [company.ticker, company.price, company.change]);

  // ---- chart ---------------------------------------------------------------
  const [rangeDays, setRangeDays] = useState(30);
  const [series, setSeries] = useState(initialPrices);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    setRangeDays(30);
    setSeries(initialPrices);
  }, [company.ticker, initialPrices]);

  function handleRangeClick(days) {
    setRangeDays(days);
    setChartLoading(true);
    // simulate a brief loading state so the range switch still feels "live"
    setTimeout(() => {
      setSeries(getChartSeries(company.ticker, days));
      setChartLoading(false);
    }, 150);
  }

  const { linePts, areaPts, up } = useMemo(
    () => seriesToPaths(series && series.length ? series : [company.price, company.price]),
    [series, company.price]
  );
  const stroke = up ? "var(--up)" : "var(--down)";
  const fillId = up ? "gradUp" : "gradDown";

  // ---- jump search in topbar ------------------------------------------------
  const [jumpQuery, setJumpQuery] = useState("");
  async function handleJumpKeyDown(e) {
    if (e.key === "Enter") {
      const q = jumpQuery.trim().toUpperCase();
      if (q) router.push(`/ticker/${q}`);
    }
  }

  const dir = quote.change >= 0 ? "up" : "down";
  const isHighRisk = risk.verdict === "high";
  const confPct = isHighRisk ? risk.confidencePct : 100 - risk.confidencePct;

  return (
    <>
      <div className="topbar">
        <Link href="/" className="back">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>
        <span className="brand">ASTOCK</span>
        <div className="search-mini">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a8b3c1" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="jumpInput"
            type="text"
            placeholder="Jump to ticker…"
            autoComplete="off"
            value={jumpQuery}
            onChange={(e) => setJumpQuery(e.target.value)}
            onKeyDown={handleJumpKeyDown}
          />
        </div>
      </div>

      <div className="container">
        <div className="head-row">
          <div className="head-left">
            <div className="badge-big">{initials(company.name)}</div>
            <div className="head-titles">
              <div className="sym">{company.ticker}</div>
              <div className="cname">{company.name}</div>
            </div>
          </div>
          <div className="price-block">
            <div className="px">${quote.price.toFixed(2)}</div>
            <div className={`chg ${dir}`}>
              {quote.change >= 0 ? "▲" : "▼"} {fmtChg(quote.change)} today
            </div>
          </div>
        </div>

        <div className="main-grid">
          {/* LEFT COLUMN */}
          <div>
            <div className="panel chart-panel">
              <div className="panel-title">
                Price History{chartLoading ? " · updating…" : ""}
              </div>
              <div className="chart-range">
                {CHART_RANGES.map((r) => (
                  <button
                    key={r.days}
                    className={rangeDays === r.days ? "active" : ""}
                    onClick={() => handleRangeClick(r.days)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="chart-svg-wrap">
                <svg id="priceChart" viewBox="0 0 640 260" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22e8a3" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#22e8a3" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5c72" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#ff5c72" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={areaPts} fill={`url(#${fillId})`} />
                  <polyline
                    points={linePts}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="panel summary-panel">
              <div className="panel-title">Company Snapshot</div>
              <p>{company.summary}</p>
              <div className="summary-stats">
                <div className="stat">
                  <div className="slabel">52w Range</div>
                  <div className="sval">
                    ${risk.low52.toFixed(2)} – ${risk.high52.toFixed(2)}
                  </div>
                </div>
                <div className="stat">
                  <div className="slabel">Avg Volume</div>
                  <div className="sval">{risk.avgVolumeM.toFixed(1)}M</div>
                </div>
                <div className="stat">
                  <div className="slabel">Market Cap</div>
                  <div className="sval">${risk.marketCapB.toFixed(0)}B</div>
                </div>
                <div className="stat">
                  <div className="slabel">Sector</div>
                  <div className="sval">{company.sector}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div className={`panel risk-panel ${isHighRisk ? "high" : "low"}`}>
              <div className="risk-eyebrow">
                <span className="pulse"></span> Astock Risk Model &middot; Live Verdict
              </div>
              <div className="risk-verdict">
                {isHighRisk ? "HIGH RISK" : "LOW RISK"}
              </div>
              <div className="risk-sub">
                {isHighRisk
                  ? `${company.ticker} is flagged for elevated volatility risk over the next session — the model expects a wider-than-usual price swing.`
                  : `${company.ticker} sits inside its normal volatility band — the model does not expect an unusual price swing next session.`}
              </div>

              <div className="risk-confidence">
                <span className="label">Confidence</span>
                <div className="conf-track">
                  <div className="conf-fill" style={{ width: `${confPct}%` }}></div>
                </div>
                <span className="pct">{Math.round(confPct)}%</span>
              </div>

              <div className="factor-list">
                <div className="factor-row">
                  <span className="fname">14d Volatility</span>
                  <div className="factor-track">
                    <div
                      className="factor-fill"
                      style={{ width: `${Math.min(100, risk.volatilityPct * 18)}%` }}
                    ></div>
                  </div>
                  <span className="fval">{risk.volatilityPct.toFixed(2)}%</span>
                </div>
                <div className="factor-row">
                  <span className="fname">Price / MA20</span>
                  <div className="factor-track">
                    <div
                      className="factor-fill"
                      style={{
                        width: `${Math.min(100, Math.abs(risk.priceToMa20 - 1) * 400)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="fval">{risk.priceToMa20.toFixed(2)}x</span>
                </div>
                <div className="factor-row">
                  <span className="fname">Volume Surge</span>
                  <div className="factor-track">
                    <div
                      className="factor-fill"
                      style={{ width: `${risk.volumeSurgePct}%` }}
                    ></div>
                  </div>
                  <span className="fval">{Math.round(risk.volumeSurgePct)}%</span>
                </div>
              </div>

              <div className="risk-note">
                Predicted by ASTOCK&apos;s risk classifier — trained on daily
                return, price-to-MA20 and volume. Output is a probability, not
                a guarantee.
              </div>
            </div>

            <div className="panel direction-panel">
              <div className="dtext">
                Next-session
                <br />
                direction call
              </div>
              <div className={`dverdict ${risk.directionUp ? "up" : "down"}`}>
                {risk.directionUp ? "▲ UP" : "▼ DOWN"} &middot;{" "}
                {risk.directionConfidencePct.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer>ASTOCK &middot; mock demo data &middot; not investment advice</footer>
    </>
  );
}