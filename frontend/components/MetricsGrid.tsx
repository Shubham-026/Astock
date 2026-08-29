import { CompanyInfo } from "@/lib/types";

export default function MetricsGrid({ info }: { info: CompanyInfo }) {
  const metrics = [
    { label: "P/E Ratio", value: info.peRatio.toFixed(1) },
    { label: "Market Cap", value: info.marketCap },
    { label: "Dividend Yield", value: `${info.dividendYield.toFixed(2)}%` },
    { label: "EBITDA", value: info.ebitda },
    { label: "52-Week High", value: `$${info.weekHigh52.toFixed(2)}` },
    { label: "52-Week Low", value: `$${info.weekLow52.toFixed(2)}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div key={m.label} className="glass-card rounded-xl p-4">
          <p className="label-eyebrow mb-1.5">{m.label}</p>
          <p className="font-mono text-lg font-semibold text-ink">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
