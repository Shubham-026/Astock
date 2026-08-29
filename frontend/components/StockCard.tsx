import Link from "next/link";
import { Stock } from "@/lib/types";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const SECTOR_ACCENTS: Record<string, string> = {
  Technology: "text-aqua border-aqua/25 bg-aqua/10",
  Healthcare: "text-violet border-violet/25 bg-violet/10",
  Financials: "text-warn border-warn/25 bg-warn/10",
  Energy: "text-down border-down/25 bg-down/10",
  "Consumer Discretionary": "text-aqua border-aqua/25 bg-aqua/10",
  Industrials: "text-ink-muted border-white/15 bg-white/5",
  "Communication Services": "text-violet border-violet/25 bg-violet/10",
  Materials: "text-warn border-warn/25 bg-warn/10",
  Utilities: "text-up border-up/25 bg-up/10",
  "Real Estate": "text-ink-muted border-white/15 bg-white/5",
};

export default function StockCard({ stock }: { stock: Stock }) {
  const positive = stock.change >= 0;
  const accent = SECTOR_ACCENTS[stock.sector] ?? "text-ink-muted border-white/15 bg-white/5";

  return (
    <Link
      href={`/${stock.symbol}`}
      className="glass-card focus-ring group flex flex-col gap-4 rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-sm font-semibold tracking-wide text-ink">
            {stock.symbol}
          </p>
          <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">{stock.name}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${accent}`}
        >
          {stock.sector}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-2xl font-semibold text-ink">
            ${stock.price.toFixed(2)}
          </p>
          <div
            className={`mt-1 flex items-center gap-1 text-xs font-medium ${
              positive ? "text-up" : "text-down"
            }`}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(stock.change).toFixed(2)}% today
          </div>
        </div>
        <p className="font-mono text-xs text-ink-faint">Vol {stock.volume}</p>
      </div>

      <div className="h-px w-full bg-white/10 transition-colors group-hover:bg-aqua/30" />
      <p className="text-xs text-ink-faint">View prediction & risk profile \u2192</p>
    </Link>
  );
}
