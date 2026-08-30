import { notFound } from "next/navigation";
import { fetchChart, fetchCompany, fetchRisk, ApiError } from "@/lib/api";
import TickerView from "@/components/TickerView";

// Always fetch fresh — this page shows live/near-live market data.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  try {
    const company = await fetchCompany(params.symbol.toUpperCase());
    return { title: `${company.ticker} \u00b7 ASTOCK` };
  } catch {
    return { title: "ASTOCK" };
  }
}

export default async function TickerPage({ params }) {
  const ticker = params.symbol.toUpperCase();

  let company, risk, chart;
  try {
    [company, risk, chart] = await Promise.all([
      fetchCompany(ticker),
      fetchRisk(ticker),
      fetchChart(ticker, 30),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <TickerView company={company} risk={risk} initialPrices={chart.prices} />
  );
}
