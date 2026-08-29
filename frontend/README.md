# Astock

A modern, responsive Liquid Glass (glassmorphism) frontend for a stock
prediction and risk assessment app, built with Next.js 14 (App Router),
Tailwind CSS, Recharts, and Lucide React.

## Design system

- **Background:** near-black void (`#030712`) with soft aqua/violet radial
  glows and a faint animated grid.
- **Glass surfaces:** `backdrop-blur-md bg-white/5 border border-white/10`
  (see the `.glass`, `.glass-card`, `.glass-panel` utilities in
  `app/globals.css`).
- **Accents:** aqua `#5EEAD4` (primary / price data), violet `#A78BFA`
  (ML predictions), green `#34D399` (gains / low risk), red `#FB7185`
  (losses / high risk), amber `#FBBF24` (moderate risk).
- **Type:** Space Grotesk (display), Inter (body), JetBrains Mono (tickers,
  prices, and all numeric data).
- **Signature element:** the "pulse grid" hero background \u2014 glowing
  nodes traveling along price-tick paths over a faint grid, echoing a live
  market feed.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional, defaults to localhost:8000/api
npm run dev
```

Open http://localhost:3000.

### Add your logo

Drop your real logo at `public/logo.jpg` (a placeholder gradient mark is
included so the navbar renders correctly out of the box; if the image ever
fails to load, the navbar automatically falls back to an inline SVG mark).

## Backend integration

All data fetching lives in `lib/api.ts` and targets
`NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000/api`):

| Endpoint | Used for |
| --- | --- |
| `GET /api/stocks` | 200-stock discovery grid |
| `GET /api/info/{symbol}` | Company header + summary + metrics |
| `GET /api/chart/{symbol}?range=1M\|6M\|1Y` | Price chart |
| `GET /api/predict/{symbol}` | Expected return + risk score |

If the backend is unreachable (e.g. not running yet), every call falls back
to deterministic mock data generated in `lib/mockData.ts`, so the frontend
is fully functional and demoable on its own.

## Pages

- `/` \u2014 hero search, ticker marquee, and a filterable grid of 200 stocks.
- `/[symbol]` \u2014 company detail page with an interactive price chart,
  ML prediction badge, color-coded risk gauge, and a key metrics grid.
