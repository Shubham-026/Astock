"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchChart } from "@/lib/api";
import { ChartPoint, ChartRange } from "@/lib/types";
import GlassCard from "./GlassCard";

const RANGES: ChartRange[] = ["1M", "6M", "1Y"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-lg">
      <p className="font-mono text-[11px] text-ink-faint">{label}</p>
      <p className="font-mono text-sm font-semibold text-aqua">
        ${payload[0].value?.toFixed(2)}
      </p>
    </div>
  );
}

export default function PriceChart({
  symbol,
  initialData,
  positive,
}: {
  symbol: string;
  initialData: ChartPoint[];
  positive: boolean;
}) {
  const [range, setRange] = useState<ChartRange>("1M");
  const [data, setData] = useState<ChartPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetchChart(symbol, range).then((points) => {
      if (!cancelled) startTransition(() => setData(points));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, symbol]);

  const lineColor = positive ? "#34D399" : "#FB7185";

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-medium text-ink">Price history</h3>
        <div className="glass-pill flex gap-1 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`focus-ring rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                range === r ? "bg-aqua text-void" : "text-ink-muted hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className={`h-64 w-full transition-opacity duration-200 sm:h-80 ${isPending ? "opacity-60" : "opacity-100"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8B95A7", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#8B95A7", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#priceFill)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
