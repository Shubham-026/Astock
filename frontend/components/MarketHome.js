"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COMPANIES, searchCompaniesLocal, jitterQuote } from "@/lib/mockData";
import { fmtChg, initials } from "@/lib/format";

const QUOTE_POLL_MS = 4000;

export default function MarketHome() {
  const router = useRouter();

  // ---- company list, seeded from mock data and "live" jittered in place ---
  const [companies, setCompanies] = useState(COMPANIES);
  const loading = false;
  const error = null;

  useEffect(() => {
    const id = setInterval(() => {
      setCompanies((prev) =>
        prev.map((c) => ({ ...c, ...jitterQuote(c.ticker, c) }))
      );
    }, QUOTE_POLL_MS);
    return () => clearInterval(id);
  }, []);

  // ---- search bar ---------------------------------------------------------
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      return;
    }
    setMatches(searchCompaniesLocal(query, companies));
  }, [query, companies]);

  function jumpTo(ticker) {
    router.push(`/ticker/${ticker}`);
  }

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      const q = query.trim().toUpperCase();
      const match =
        companies.find((c) => c.ticker === q) ||
        companies.find(
          (c) =>
            c.ticker.toUpperCase().includes(q) ||
            c.name.toUpperCase().includes(q)
        );
      if (match) jumpTo(match.ticker);
      setSuggestOpen(false);
    }
  }

  const marqueeItems = useMemo(
    () => [...companies, ...companies],
    [companies]
  );

  return (
    <>
      <section className="hero">
        {/* Drop your background mp4 in /public. If no source resolves, the
            animated fallback behind it (visible immediately below) shows instead. */}
        <video autoPlay muted loop playsInline poster="">
          <source src="/market-bg.mp4" type="video/mp4" />
        </video>
        {/* <div className="bg-fallback">
          <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
            <polyline
              className="line up"
              points="0,420 80,400 160,430 240,360 320,380 400,300 480,330 560,260 640,290 720,220 800,250 880,180 960,210 1040,150 1120,175 1200,120"
            />
            <polyline
              className="line down"
              points="0,560 90,540 170,575 250,520 330,545 410,500 490,530 570,470 650,495 730,450 810,480 890,430 970,455 1050,410 1130,435 1200,400"
            />
          </svg>
        </div> */}
        <div className="hero-scrim"></div>

        <div className="hero-content">
          <h1 className="logo">ASTOCK</h1>
          <p className="tagline">
            Signal over noise <span className="dot">&middot;</span> AI-Read
            Markets
          </p>

          <div className="search-wrap" ref={wrapRef}>
            <div className="search-bar">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a8b3c1"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="searchInput"
                type="text"
                placeholder="Search a ticker or company — try AAPL, NVDA, JPM..."
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={handleKeyDown}
              />
              <span className="search-kbd">&#8629;</span>
            </div>
            <div
              className={`search-suggest${suggestOpen && matches.length ? " open" : ""}`}
            >
              {matches.map((c) => {
                const dir = c.change >= 0 ? "up" : "down";
                const arrow = c.change >= 0 ? "▲" : "▼";
                return (
                  <div
                    key={c.ticker}
                    className="suggest-row"
                    onClick={() => {
                      setQuery(c.ticker);
                      setSuggestOpen(false);
                      jumpTo(c.ticker);
                    }}
                  >
                    <span className="left">
                      <span className="sym">{c.ticker}</span>
                      <span className="name">{c.name}</span>
                    </span>
                    <span className={`chg ${dir}`}>
                      {arrow} {fmtChg(c.change)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <a href="#companies" className="scroll-cue" aria-label="Scroll to company list">
          <span>Explore Coverage</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8b3c1" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>

        <div className="ticker-dock">
          <div className="marquee-track">
            {marqueeItems.map((c, i) => {
              const dir = c.change >= 0 ? "up" : "down";
              const arrow = c.change >= 0 ? "▲" : "▼";
              return (
                <Link
                  key={`${c.ticker}-${i}`}
                  className={`tick flash-${dir}`}
                  href={`/ticker/${c.ticker}`}
                >
                  <span className="sym">{c.ticker}</span>
                  <span className="px">${c.price.toFixed(2)}</span>
                  <span className={`chg ${dir}`}>
                    {arrow} {fmtChg(c.change)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="companies" id="companies">
        <div className="companies-head">
          <div>
            <h2>Under Coverage</h2>
            <p>Ranked by model confidence &middot; updated on close</p>
          </div>
          <span className="count">{companies.length} tickers</span>
        </div>

        {loading && <p style={{ textAlign: "center", color: "var(--mist)" }}>Loading market data…</p>}
        {error && !loading && (
          <p style={{ textAlign: "center", color: "var(--down)" }}>
            Couldn&apos;t reach the backend.
          </p>
        )}

        <div className="grid">
          {companies.map((c) => {
            const dir = c.change >= 0 ? "up" : "down";
            const arrow = c.change >= 0 ? "▲" : "▼";
            return (
              <Link key={c.ticker} className="card" tabIndex={0} href={`/ticker/${c.ticker}`}>
                <div className="top">
                  <span className="ticker">{c.ticker}</span>
                  <span className="badge">{initials(c.name)}</span>
                </div>
                <div className="cname">{c.name}</div>
                <div className="bottom">
                  <span className="price">${c.price.toFixed(2)}</span>
                  <span className={`chg ${dir}`}>
                    {arrow} {fmtChg(c.change)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer>ASTOCK &middot; mock demo data &middot; not investment advice</footer>
    </>
  );
}