# Architect-19 Trade Ai

Institutional-style market analysis and signal dashboard (stocks, forex, crypto) with:
- non-repaint signal lock (closed-candle mode),
- ensemble strategy scoring,
- walk-forward backtest diagnostics,
- risk manager with kill-switch,
- AI assistant chat endpoint,
- institutional ownership flow table (Yahoo ownership modules),
- fresh fundamental/news feeds filtered to last 48 hours,
- geopolitical monitor feed (last 48 hours),
- TradingView panel with Pine-style script parser (subset -> mapped studies).

## Pine Script Note

- The public TradingView widget cannot execute full custom Pine Script engine.
- Current implementation provides a Pine-style input parser that maps common indicators (`EMA`, `RSI`, `MACD`, `BB`, etc.) to TradingView studies.
- Full Pine compatibility requires TradingView Charting Library licensing + custom datafeed/backend integration.

## Local Run

Prerequisite: Node.js 20+.

1. Install dependencies:
   `npm install`
2. Optional env for external AI model:
   set `GEMINI_API_KEY`
3. Start dev server:
   `npm run dev`
4. Production-like local start:
   `npm start`

Server URL: `http://localhost:3000`

## Deploy to GitHub

1. Create a GitHub repository.
2. Push this project:
   - `git init`
   - `git add .`
   - `git commit -m "vercel-ready release"`
   - `git branch -M main`
   - `git remote add origin <your_repo_url>`
   - `git push -u origin main`

## Deploy to Vercel

This project is configured for Vercel with:
- serverless API handler: `api/[...path].ts`
- routing config: `vercel.json`

### Steps
1. Import the GitHub repo into Vercel.
2. Framework preset: `Other` (or auto-detected).
3. Build command: `npm run build`
4. Output directory: `dist`
5. Install command: `npm install`
6. Environment variables:
   - `GEMINI_API_KEY` (optional but recommended)
   - `NODE_ENV=production`

## Deploy to Netlify

This project is configured for Netlify with:
- function adapter: `netlify/functions/api.ts`
- routing/build config: `netlify.toml`

### Steps
1. Push repo to GitHub.
2. In Netlify, choose **Add new site** > **Import from Git**.
3. Select this repository.
4. Netlify will read `netlify.toml` automatically.
5. Set environment variables:
   - `GEMINI_API_KEY` (optional)
   - `NODE_ENV=production`
6. Deploy, then verify:
   - `/api/health` returns `{"status":"ok"}`.

## Deploy Notes

- `npm start` and `npm run dev` run `tsx server.ts` for local.
- On Vercel, API traffic is served through `api/[...path].ts`.
- SPA fallback is handled by `vercel.json`.
- On Netlify, API traffic is served through `/.netlify/functions/api`.
