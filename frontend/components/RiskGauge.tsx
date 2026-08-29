import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

function riskProfile(score: number) {
  if (score <= 3.9)
    return { label: "Low risk", color: "#34D399", bg: "bg-up/10", text: "text-up", Icon: ShieldCheck };
  if (score <= 6.9)
    return { label: "Moderate risk", color: "#FBBF24", bg: "bg-warn/10", text: "text-warn", Icon: AlertTriangle };
  return { label: "High risk", color: "#FB7185", bg: "bg-down/10", text: "text-down", Icon: ShieldAlert };
}

export default function RiskGauge({ score }: { score: number }) {
  const { label, color, bg, text, Icon } = riskProfile(score);
  const pct = Math.min(100, Math.max(0, ((score - 1) / 9) * 100));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>
          <Icon size={13} />
          {label}
        </span>
        <span className="font-mono text-xl font-semibold text-ink">
          {score.toFixed(1)}
          <span className="text-sm text-ink-faint">/10</span>
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 14px 0 ${color}66`,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-faint">
        <span>1.0</span>
        <span>4.0</span>
        <span>7.0</span>
        <span>10.0</span>
      </div>
    </div>
  );
}
