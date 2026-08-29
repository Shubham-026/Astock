"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Stock } from "@/lib/types";

export default function HeroSearch({
  stocks,
  query,
  onQueryChange,
}: {
  stocks: Stock[];
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return stocks
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [stocks, query]);

  const showDropdown = focused && query.trim().length > 0 && suggestions.length > 0;

  function goToSymbol(symbol: string) {
    setFocused(false);
    router.push(`/${symbol}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goToSymbol(suggestions[activeIndex].symbol);
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div
        className={`glass-strong relative flex items-center gap-3 rounded-2xl px-5 py-4 transition-all duration-300 ${
          focused ? "animate-glow border-aqua/40" : ""
        }`}
      >
        <Search className="shrink-0 text-aqua" size={22} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={handleKeyDown}
          type="text"
          inputMode="search"
          placeholder="Search 200+ stocks by ticker, name, or sector\u2026"
          className="focus-ring w-full bg-transparent font-mono text-base text-ink placeholder:text-ink-faint"
          aria-label="Search stocks"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
        />
        <kbd className="hidden shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] text-ink-faint sm:block">
          /
        </kbd>
      </div>

      {showDropdown && (
        <ul className="glass-panel absolute z-30 mt-2 w-full overflow-hidden rounded-2xl py-2">
          {suggestions.map((s, i) => {
            const positive = s.change >= 0;
            return (
              <li key={s.symbol}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToSymbol(s.symbol)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    activeIndex === i ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-ink">{s.symbol}</span>
                    <span className="line-clamp-1 text-sm text-ink-muted">{s.name}</span>
                  </span>
                  <span className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-ink-muted">${s.price.toFixed(2)}</span>
                    <span className={`flex items-center gap-0.5 ${positive ? "text-up" : "text-down"}`}>
                      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(s.change).toFixed(2)}%
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
