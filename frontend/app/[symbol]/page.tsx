import { notFound } from "next/navigation";
import { fetchChart, fetchCompanyInfo, fetchPrediction } from "@/lib/api";
import CompanyHeader from "@/components/CompanyHeader";
import GlassCard from "@/components/GlassCard";
import PriceChart from "@/components/PriceChart";
import RiskGauge from "@/components/RiskGauge";
import PredictionBadge from "@/components/PredictionBadge";
import MetricsGrid from "@/components/MetricsGrid";

export default async function CompanyPage({
  params,
}: {
  params: { symbol: string };
}) {
  const symbol = params.symbol.toUpperCase();

  const [info, chartData, prediction] = await Promise.all([
    fetchCompanyInfo(symbol),
    fetchChart(symbol, "1M"),
    fetchPrediction(symbol),
  ]);

  if (!info || !prediction) notFound();

  const positive = info.change >= 0;

  return (
    <div className="mx-auto max-w-6xl animate-fade-in px-5 pb-24 pt-28 sm:px-8">
      <CompanyHeader info={info} />

      <GlassCard className="mt-8 p-5 sm:p-6">
        <p className="label-eyebrow mb-2">About {info.name}</p>
        <p className="text-sm leading-relaxed text-ink-muted sm:text-base">{info.summary}</p>
      </GlassCard>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PriceChart symbol={symbol} initialData={chartData} positive={positive} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <GlassCard className="p-5 sm:p-6">
            <PredictionBadge prediction={prediction} />
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <p className="label-eyebrow mb-4">Risk score</p>
            <RiskGauge score={prediction.riskScore} />
          </GlassCard>
        </div>
      </div>

      <div className="mt-6">
        <p className="label-eyebrow mb-4">Key financial metrics</p>
        <MetricsGrid info={info} />
      </div>
    </div>
  );
}
