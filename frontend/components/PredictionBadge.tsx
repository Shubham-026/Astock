import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Prediction } from "@/lib/types";

export default function PredictionBadge({ prediction }: { prediction: Prediction }) {
  const positive = prediction.expectedReturn >= 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-violet" size={16} />
        <p className="label-eyebrow">{prediction.horizon} ML forecast</p>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={`flex items-center gap-1 font-mono text-4xl font-semibold ${
            positive ? "text-up" : "text-down"
          }`}
        >
          {positive ? <ArrowUpRight size={26} /> : <ArrowDownRight size={26} />}
          {positive ? "+" : ""}
          {prediction.expectedReturn.toFixed(2)}%
        </span>
        <span className="text-sm text-ink-muted">expected return</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-aqua to-violet"
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
        <span className="font-mono text-xs text-ink-muted">
          {prediction.confidence}% model confidence
        </span>
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">{prediction.narrative}</p>
    </div>
  );
}
