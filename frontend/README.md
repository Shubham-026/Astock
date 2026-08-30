<<<<<<< HEAD
# ASTOCK — Next.js frontend (backend-wired)

Next.js 14 App Router frontend for ASTOCK. All mock data and the
seeded-random "risk model" have been removed — every price, chart,
and risk figure now comes from your backend over HTTP.

## Structure

- `lib/api.js` — **the only file that talks to the backend.** Documents
  the full expected request/response contract at the top of the file.
  If your backend's routes or JSON shapes differ, this is the one
  place to change.
- `lib/format.js` — pure display helpers (`fmtChg`, `initials`,
  `fmtUsd`). No data lives here.
- `app/page.js` + `components/MarketHome.js` — landing page. Fetches
  `/api/companies` on load and polls it every 4s for live
  price/change updates (marquee + grid). Search bar calls
  `searchCompanies()`, which hits `/api/companies/search?q=` if your
  backend implements it, otherwise falls back to filtering the
  already-loaded list client-side.
- `app/ticker/[symbol]/page.js` — server component. Fetches the
  company, risk verdict, and default 1M chart server-side
  (`force-dynamic`, no caching) before rendering, and calls
  Next's `notFound()` on a 404 from the backend.
- `components/TickerView.js` — client component. Polls
  `/api/companies/:ticker/quote` every 2.2s for the live header price,
  and re-fetches `/api/companies/:ticker/chart?range=` whenever you
  click a 1M/3M/6M/1Y button.
- `app/error.js` — friendly fallback if the backend is unreachable.
- `app/not-found.js` — shown for an unknown ticker (backend 404).
- `app/globals.css` — merged/deduplicated styles from the two
  original HTML files.

## Backend contract

See the full documented contract at the top of `lib/api.js`. Summary:

| Endpoint | Returns |
|---|---|
| `GET /api/companies` | `[{ ticker, name, sector, price, change }]` |
| `GET /api/companies/:ticker` | `{ ticker, name, sector, summary, price, change }` |
| `GET /api/companies/:ticker/quote` | `{ price, change }` |
| `GET /api/companies/:ticker/chart?range=30\|90\|180\|365` | `{ prices: number[] }` |
| `GET /api/companies/:ticker/risk` | `{ verdict, confidencePct, volatilityPct, priceToMa20, volumeSurgePct, directionUp, directionConfidencePct, low52, high52, avgVolumeM, marketCapB }` |
| `GET /api/companies/search?q=` | *(optional)* `[{ ticker, name, sector, price, change }]` |

`change` is % change today (e.g. `1.42` or `-0.83`), not a dollar amount.

If your backend's actual field names or routes are different, tell me
the real shape and I'll adjust `lib/api.js` and the two components to
match — no need to touch anything else.

## Configuration

Copy `.env.local.example` to `.env.local` and point it at your backend:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Defaults to `http://localhost:8000` if unset.

## Run it

```bash
npm install
npm run dev
```

Your backend needs to be running (and have CORS enabled for the
frontend's origin) for any of this to load — without it you'll see
the "Couldn't reach the backend" message on the landing page and the
`app/error.js` fallback on ticker pages.
=======
# ASTOCK

Premium fintech dashboard prototype — Indian stock market research & AI analysis UI, built with React + Vite.

## Run locally
```
npm install
npm run dev
```
Then open the local URL it prints (usually http://localhost:5173).

## Build for deployment
```
npm run build
```
This outputs a static site into `dist/` that can be hosted anywhere for free (Vercel, Netlify, GitHub Pages, Cloudflare Pages).

Note: all market data is illustrative mock data, structured so real APIs can be swapped in later.
>>>>>>> upstream/main
