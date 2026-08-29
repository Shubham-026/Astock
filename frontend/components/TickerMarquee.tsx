import { Stock } from "@/lib/types";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function TickerMarquee({ stocks }: { stocks: Stock[] }) {
  const strip = stocks.slice(0, 24);
  const loop = [...strip, ...strip];

  return (
    <div className="glass-pill relative mx-auto mt-6 w-full max-w-3xl overflow-hidden py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-void to-transparent" />
      <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
        {loop.map((s, i) => {
          const positive = s.change >= 0;
          return (
            <div key={`${s.symbol}-${i}`} className="flex shrink-0 items-center gap-2 font-mono text-xs">
              <span className="font-semibold text-ink">{s.symbol}</span>
              <span className="text-ink-muted">${s.price.toFixed(2)}</span>
              <span
                className={`flex items-center gap-0.5 ${positive ? "text-up" : "text-down"}`}
              >
                {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(s.change).toFixed(2)}%
              </span>
              <span className="text-ink-faint">\u2022</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
