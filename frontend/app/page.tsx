import { fetchStocks } from "@/lib/api";
import HomeClient from "@/components/HomeClient";

export default async function HomePage() {
  const stocks = await fetchStocks();
  return <HomeClient stocks={stocks} />;
}
