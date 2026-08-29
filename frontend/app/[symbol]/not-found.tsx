import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
      <div className="glass-panel flex h-16 w-16 items-center justify-center rounded-2xl">
        <SearchX className="text-ink-faint" size={26} />
      </div>
      <h1 className="mt-6 font-display text-2xl font-semibold text-ink">Ticker not found</h1>
      <p className="mt-2 text-sm text-ink-muted">
        We couldn&rsquo;t find a stock matching that symbol. Try searching from the
        homepage instead.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to search
      </Link>
    </div>
  );
}
