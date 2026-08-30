/**
 * Loads the list of allowed tickers from /public/ticker.txt (one ticker
 * per line, blank lines ignored, case-insensitive). Search is restricted
 * to whatever's in this file — anything not listed there won't show up
 * in search suggestions or match on Enter, even if the backend returns it.
 *
 * Cached after the first successful load since the file rarely changes
 * within a session; refresh the page to pick up edits to ticker.txt.
 */

let cachedTickers = null;

export async function fetchAllowedTickers() {
  if (cachedTickers) return cachedTickers;

  try {
    const res = await fetch("/ticker.txt", { cache: "no-store" });
    if (!res.ok) throw new Error(`ticker.txt failed with ${res.status}`);
    const text = await res.text();
    cachedTickers = text
      .split(/\r?\n/)
      .map((line) => line.trim().toUpperCase())
      .filter(Boolean);
  } catch {
    // If the file is missing, fail open (don't restrict search) rather
    // than silently breaking search for everyone.
    cachedTickers = null;
  }

  return cachedTickers;
}