import Link from "next/link";
import { ArrowLeft, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CompanyInfo } from "@/lib/types";

export default function CompanyHeader({ info }: { info: CompanyInfo }) {
  const positive = info.change >= 0;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="focus-ring flex w-fit items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-aqua"
      >
        <ArrowLeft size={15} />
        Back to discovery
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="glass-panel flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
            <span className="font-mono text-sm font-bold text-aqua">
              {info.symbol.slice(0, 4)}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                {info.name}
              </h1>
              <span className="glass-pill font-mono text-xs font-semibold text-ink px-2.5 py-1">
                {info.symbol}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-ink-muted">
              {info.sector} <span className="text-ink-faint">\u2022</span> {info.industry}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="font-mono text-3xl font-semibold text-ink sm:text-4xl">
            ${info.price.toFixed(2)}
          </p>
          <p
            className={`mt-1 flex items-center gap-1 text-sm font-medium sm:justify-end ${
              positive ? "text-up" : "text-down"
            }`}
          >
            {positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
            {Math.abs(info.change).toFixed(2)}% today
          </p>
        </div>
      </div>
    </div>
  );
}
