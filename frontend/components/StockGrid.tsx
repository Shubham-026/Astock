import { Stock } from "@/lib/types";
import StockCard from "./StockCard";
import { SearchX } from "lucide-react";

export default function StockGrid({ stocks, query }: { stocks: Stock[]; query: string }) {
  if (stocks.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center">
        <SearchX className="text-ink-faint" size={28} />
        <p className="font-display text-lg text-ink">No matches for &ldquo;{query}&rdquo;</p>
        <p className="max-w-sm text-sm text-ink-muted">
          Try a ticker symbol, company name, or sector \u2014 like &ldquo;NOVA&rdquo;, &ldquo;Energy&rdquo;, or
          &ldquo;Robotics&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stocks.map((stock) => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  );
}
