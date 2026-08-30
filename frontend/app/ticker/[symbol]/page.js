import { notFound } from "next/navigation";
import { getCompany, getRisk, getChartSeries } from "@/lib/mockData";
import TickerView from "@/components/TickerView"; // adjust import path to wherever TickerView.js lives

export default async function TickerPage({ params }) {
  const { symbol } = await params;

  const company = getCompany(symbol);
  if (!company) return notFound();

  // Kept as Promise.all/async for structural parity with the old data-fetching
  // page, but these all resolve synchronously from local mock data now —
  // nothing here makes a network call.
  const [risk, initialPrices] = await Promise.all([
    Promise.resolve(getRisk(company.ticker)),
    Promise.resolve(getChartSeries(company.ticker, 30)),
  ]);

  return <TickerView company={company} risk={risk} initialPrices={initialPrices} />;
}