import express from "express";
import { GoogleGenAI } from "@google/genai";

type MarketType = "stock" | "forex" | "crypto" | "unknown";
type Signal = "BUY" | "SELL" | "HOLD";
type StrategyName = "trend" | "mean_reversion" | "breakout" | "momentum";
type RegimeState = "trending" | "range" | "high_volatility";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SymbolInfo {
  input: string;
  displaySymbol: string;
  querySymbol: string;
  marketType: MarketType;
}

interface NewsHeadline {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
  query: string;
}

interface CalendarItem {
  event: string;
  impact: "high" | "medium" | "low";
  timestamp: string;
  source: string;
  currency?: string;
  link?: string;
  isUpcoming?: boolean;
}

interface IntelNarrative {
  bias: "bullish" | "bearish" | "neutral";
  warningLevel: "high" | "medium" | "low";
  strength: number;
  summary: string;
  factors: string[];
  sentimentScore: number;
  upcomingHighImpact: number;
  recentHighImpact: number;
}

interface GeopoliticalEvent {
  title: string;
  region: string;
  riskLevel: "high" | "medium" | "low";
  publishedAt: string;
  source: string;
  link: string;
}

interface InstitutionalActor {
  organization: string;
  source: "institutionOwnership" | "fundOwnership";
  side: "BUY" | "SELL" | "HOLD";
  pctHeld: number | null;
  pctChange: number | null;
  position: number | null;
  value: number | null;
  estimatedFlowShares: number | null;
  reportDate: string;
}

interface InstitutionalSummary {
  totalTracked: number;
  buyActors: number;
  sellActors: number;
  holdActors: number;
  buyFlowShares: number;
  sellFlowShares: number;
  dominantSide: "BUY" | "SELL" | "NEUTRAL";
  dominanceScore: number;
  topBuyer: string | null;
  topSeller: string | null;
}

interface InstitutionalResponse {
  symbol: string;
  marketType: MarketType;
  supported: boolean;
  note?: string;
  updatedAt: string;
  insiderNetShares: number | null;
  insiderBuyShares: number | null;
  insiderSellShares: number | null;
  summary: InstitutionalSummary;
  rows: InstitutionalActor[];
}

interface StrategyVote {
  name: StrategyName;
  score: number;
  signal: Signal;
  confidence: number;
  weight: number;
  reason: string;
}

interface EnsembleResult {
  score: number;
  bullishScore: number;
  bearishScore: number;
  confidence: number;
  consensus: number;
  signal: Signal;
  regime: {
    state: RegimeState;
    trendStrength: number;
    volatilityPct: number;
    volumeRatio: number;
  };
  votes: StrategyVote[];
}

interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  direction: "LONG" | "SHORT";
  entry: number;
  exit: number;
  riskCapital: number;
  netPnl: number;
  netReturnPct: number;
  rMultiple: number;
  barsHeld: number;
  exitReason: string;
}

interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

interface WalkForwardFold {
  fold: number;
  startDate: string;
  endDate: string;
  trades: number;
  winRate: number | null;
  netProfitPct: number;
  maxDrawdown: number | null;
  pass: boolean;
}

interface BacktestMetrics {
  trades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  maxDrawdown: number | null;
  expectancyR: number | null;
  avgTradeR: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  payoff: number | null;
  profitFactor: number | null;
  sharpe: number | null;
  sortino: number | null;
  calmar: number | null;
  cagr: number | null;
  recoveryFactor: number | null;
  exposurePct: number | null;
  netProfitPct: number | null;
  maxConsecutiveLosses: number;
  walkForwardPassRate: number | null;
  walkForwardFolds: number;
  feesPaidPct: number | null;
  slippagePaidPct: number | null;
  spreadPaidPct: number | null;
  folds: WalkForwardFold[];
  equityCurve: EquityPoint[];
  lastTrades: BacktestTrade[];
}

interface RiskPlan {
  killSwitch: boolean;
  allowedTrade: boolean;
  riskPerTradePct: number;
  suggestedPositionPct: number;
  maxPortfolioRiskPct: number;
  dailyLossLimitPct: number;
  maxOpenPositions: number;
  stopDistancePct: number;
  confidenceAdjustedRisk: number;
  notes: string[];
}

interface CoreSignalResult {
  signal: Signal;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  atr: number;
  rsi: number;
  emaFast: number;
  emaSlow: number;
  trend: "Bullish" | "Bearish" | "Sideways";
  reason: string[];
  warnings: string[];
  ensemble: EnsembleResult;
}

interface AnalysisPayload extends CoreSignalResult {
  symbol: string;
  normalizedSymbol: string;
  marketType: MarketType;
  interval: string;
  range: string;
  signalLocked: boolean;
  signalCandleTime: string;
  backtest: BacktestMetrics;
  risk: RiskPlan;
}

interface IndicatorSnapshot {
  lastClose: number;
  ema9: number;
  ema21: number;
  ema50: number;
  sma20: number;
  std20: number;
  rsi14: number;
  atr14: number;
  roc5: number;
  roc14: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  donchianHigh: number;
  donchianLow: number;
  volumeRatio: number;
  trendStrength: number;
  volatilityPct: number;
}

interface FrictionModel {
  feePct: number;
  slippagePct: number;
  spreadPct: number;
}

interface PositionState {
  direction: 1 | -1;
  entryDate: string;
  entryIndex: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskCapital: number;
  quantity: number;
  maxBars: number;
  barsHeld: number;
}

interface SegmentResult {
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  endingEquity: number;
  maxDrawdown: number;
  feesPaid: number;
  slippagePaid: number;
  spreadPaid: number;
  testedBars: number;
  inMarketBars: number;
}

const PORT = Number(process.env.PORT ?? 3000);
const REQUEST_TIMEOUT_MS = 8_000;
const DEFAULT_ACCOUNT_SIZE = 10_000;
const MIN_CANDLES_FOR_MODEL = 80;
const NEWS_CACHE_TTL_MS = 180_000;
const FRESH_NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;
const UPCOMING_NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

const VALID_INTERVALS = new Set([
  "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo",
]);

const VALID_RANGES = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"]);
const FX_CODES = new Set(["USD", "EUR", "JPY", "GBP", "AUD", "NZD", "CAD", "CHF"]);
const METAL_CODES = new Set(["XAU", "XAG", "XPT", "XPD"]);

type YahooFinanceClient = {
  chart: (symbol: string, options: any) => Promise<any>;
  quote: (symbol: string) => Promise<any>;
  quoteSummary: (symbol: string, options: any) => Promise<any>;
};

let yahooFinanceClientPromise: Promise<YahooFinanceClient> | null = null;
const runtimeCache = new Map<string, { value: unknown; expiresAt: number }>();

interface AppBuildOptions {
  includeViteMiddleware?: boolean;
  includeStatic?: boolean;
}

export async function createApp(options: AppBuildOptions = {}) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/stock/:symbol/history", async (req, res) => {
    try {
      const symbolInfo = normalizeSymbol(req.params.symbol);
      const interval = validateInterval(queryString(req.query.interval));
      const range = validateRange(queryString(req.query.range));
      const candles = await fetchHistory(symbolInfo, interval, range);
      res.json(candles);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      res.status(502).json({ error: error.message ?? "Failed to fetch historical data" });
    }
  });

  app.get("/api/stock/:symbol/quote", async (req, res) => {
    try {
      const symbolInfo = normalizeSymbol(req.params.symbol);
      const quote = await fetchQuote(symbolInfo);
      res.json({
        ...quote,
        symbol: symbolInfo.displaySymbol,
        normalizedSymbol: symbolInfo.querySymbol,
        marketType: symbolInfo.marketType,
      });
    } catch (error: any) {
      console.error("Error fetching quote:", error);
      res.status(502).json({ error: error.message ?? "Failed to fetch quote" });
    }
  });

  app.get("/api/stock/:symbol/analyze", async (req, res) => {
    try {
      const symbolInfo = normalizeSymbol(req.params.symbol);
      const interval = validateInterval(queryString(req.query.interval));
      const range = validateRange(queryString(req.query.range));
      const accountSize = parseAccountSize(queryString(req.query.accountSize));
      const candles = await fetchHistory(symbolInfo, interval, range);
      const analysis = buildAnalysis(candles, symbolInfo, interval, range, accountSize);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing symbol:", error);
      res.status(502).json({ error: error.message ?? "Failed to analyze market data" });
    }
  });

  app.get("/api/stock/:symbol/backtest", async (req, res) => {
    try {
      const symbolInfo = normalizeSymbol(req.params.symbol);
      const interval = validateInterval(queryString(req.query.interval));
      const range = validateRange(queryString(req.query.range));
      const candles = await fetchHistory(symbolInfo, interval, range);
      const backtest = runInstitutionalBacktest(candles, interval, symbolInfo.marketType);
      res.json({
        symbol: symbolInfo.displaySymbol,
        normalizedSymbol: symbolInfo.querySymbol,
        marketType: symbolInfo.marketType,
        interval,
        range,
        backtest,
      });
    } catch (error: any) {
      console.error("Error running backtest:", error);
      res.status(502).json({ error: error.message ?? "Failed to run backtest" });
    }
  });

  app.get("/api/stock/:symbol/snapshot", async (req, res) => {
    try {
      const symbolInfo = normalizeSymbol(req.params.symbol);
      const interval = validateInterval(queryString(req.query.interval));
      const range = validateRange(queryString(req.query.range));
      const accountSize = parseAccountSize(queryString(req.query.accountSize));

      const [history, quote] = await Promise.all([
        fetchHistory(symbolInfo, interval, range),
        fetchQuote(symbolInfo).catch(() => null),
      ]);

      const analysis = buildAnalysis(history, symbolInfo, interval, range, accountSize);
      if (!quote) {
        analysis.warnings.push("Live quote unavailable. Snapshot uses historical close only.");
      }

      res.json({
        symbol: symbolInfo.displaySymbol,
        normalizedSymbol: symbolInfo.querySymbol,
        marketType: symbolInfo.marketType,
        interval,
        range,
        history,
        quote,
        analysis,
      });
    } catch (error: any) {
      console.error("Error building snapshot:", error);
      res.status(502).json({ error: error.message ?? "Failed to build market snapshot" });
    }
  });

  app.get("/api/institutional/:symbol", async (req, res) => {
    try {
      const symbolInfo = normalizeSymbol(req.params.symbol);
      const institutional = await fetchInstitutionalFlow(symbolInfo);
      res.json(institutional);
    } catch (error: any) {
      console.error("Error fetching institutional flow:", error);
      res.status(502).json({ error: error.message ?? "Failed to fetch institutional flow data" });
    }
  });

  app.get("/api/intel/:symbol", async (req, res) => {
    try {
      const symbolInfo = normalizeSymbol(req.params.symbol);
      const [headlines, economicCalendar] = await Promise.all([
        fetchMarketHeadlines(symbolInfo),
        fetchEconomicCalendar(symbolInfo).catch(() => []),
      ]);
      const calendar = mergeCalendarItems([
        ...economicCalendar,
        ...buildCalendarFromHeadlines(headlines),
      ]);
      const narrative = buildIntelNarrative(symbolInfo, headlines, calendar);
      const warnings = buildIntelWarnings(narrative, headlines, calendar);
      res.json({
        symbol: symbolInfo.displaySymbol,
        marketType: symbolInfo.marketType,
        headlines,
        calendar,
        narrative,
        warnings,
        freshnessHours: 48,
        updatedAt: resolveFeedUpdatedAt(headlines, calendar),
      });
    } catch (error: any) {
      console.error("Error fetching market intel:", error);
      res.status(502).json({ error: error.message ?? "Failed to fetch market intelligence feed" });
    }
  });

  app.get("/api/geopolitics", async (_req, res) => {
    try {
      const events = await fetchGeopoliticalEvents();
      res.json({
        events,
        freshnessHours: 48,
        updatedAt: resolveGeoUpdatedAt(events),
      });
    } catch (error: any) {
      console.error("Error fetching geopolitical monitor:", error);
      res.status(502).json({ error: error.message ?? "Failed to fetch geopolitical monitor feed" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const context = typeof req.body?.context === "object" && req.body?.context ? req.body.context : {};

    if (!message) return res.status(400).json({ error: "message is required" });

    const fallbackText = buildLocalChatResponse(message, context);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.json({ text: fallbackText });

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are ARCHITECT-OMNI-9000, an AI trading assistant.
Use only provided context. Do not claim guaranteed profits, fixed winrate, or certainty.
When confidence is low, say "wait for confirmation".
Always include markdown sections: Market Bias, Trade Plan, Risk Controls, Notes.
Always include one-line disclaimer: educational analysis, not financial advice.
Context: ${JSON.stringify(context)}`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        contents: message,
        config: { systemInstruction, temperature: 0.15 },
      });

      res.json({ text: response.text?.trim() || fallbackText });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.json({ text: fallbackText });
    }
  });

  const includeViteMiddleware = options.includeViteMiddleware ?? process.env.NODE_ENV !== "production";
  const includeStatic = options.includeStatic ?? process.env.NODE_ENV === "production";

  if (includeViteMiddleware && process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (includeStatic) {
    app.use(express.static("dist"));
  }

  return app;
}

async function startServer() {
  const app = await createApp({ includeViteMiddleware: true, includeStatic: true });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function queryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function parseAccountSize(input?: string): number {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_ACCOUNT_SIZE;
  return clamp(value, 1_000, 10_000_000);
}

function validateInterval(input?: string): string {
  const value = (input ?? "1d").toLowerCase();
  return VALID_INTERVALS.has(value) ? value : "1d";
}

function validateRange(input?: string): string {
  const value = (input ?? "3mo").toLowerCase();
  return VALID_RANGES.has(value) ? value : "3mo";
}

async function getYahooFinanceClient(): Promise<YahooFinanceClient> {
  if (!yahooFinanceClientPromise) {
    yahooFinanceClientPromise = import("yahoo-finance2").then((mod: any) => {
      const raw = mod?.default ?? mod;
      const candidates = [raw, raw?.default, mod];

      for (const candidate of candidates) {
        if (!candidate) continue;
        if (typeof candidate === "function") {
          try {
            const instance = new candidate();
            if (
              typeof instance.chart === "function" &&
              typeof instance.quote === "function" &&
              typeof instance.quoteSummary === "function"
            ) {
              return instance as YahooFinanceClient;
            }
          } catch {
            // ignore and try next candidate shape
          }
        }
        if (
          typeof candidate.chart === "function" &&
          typeof candidate.quote === "function" &&
          typeof candidate.quoteSummary === "function"
        ) {
          return candidate as YahooFinanceClient;
        }
      }

      throw new Error("Yahoo Finance client initialization failed");
    });
  }

  return yahooFinanceClientPromise;
}

function intervalToMs(interval: string): number | null {
  const map: Record<string, number> = {
    "1m": 60_000,
    "2m": 120_000,
    "5m": 300_000,
    "15m": 900_000,
    "30m": 1_800_000,
    "60m": 3_600_000,
    "90m": 5_400_000,
    "1h": 3_600_000,
    "1d": 86_400_000,
    "5d": 432_000_000,
    "1wk": 604_800_000,
    "1mo": 2_592_000_000,
    "3mo": 7_776_000_000,
  };
  return map[interval] ?? null;
}

function getClosedSignalCandles(candles: Candle[], interval: string): Candle[] {
  if (candles.length < 3) return candles;

  const intervalMs = intervalToMs(interval);
  if (!intervalMs) return candles.slice(0, -1);

  // Strict anti-repaint mode for intraday and daily intervals:
  // always use the previous fully completed bar.
  if (intervalMs <= 86_400_000) {
    return candles.slice(0, -1);
  }

  const last = candles[candles.length - 1];
  const lastTime = new Date(last.date).getTime();
  if (!Number.isFinite(lastTime)) return candles.slice(0, -1);

  const ageMs = Date.now() - lastTime;
  const cutoff = intervalMs * 0.9;
  if (ageMs < cutoff) {
    return candles.slice(0, -1);
  }

  return candles;
}
function normalizeSymbol(input: string): SymbolInfo {
  const metalToYahooSymbol = (base: string): string => {
    const map: Record<string, string> = {
      XAU: "GC=F",
      XAG: "SI=F",
      XPT: "PL=F",
      XPD: "PA=F",
    };
    return map[base] ?? `${base}USD=X`;
  };

  const raw = (input || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) {
    return { input, displaySymbol: "AAPL", querySymbol: "AAPL", marketType: "stock" };
  }

  if (raw.includes("/")) {
    const [base, quote] = raw.split("/");
    if (base && quote && METAL_CODES.has(base) && quote === "USD") {
      return {
        input,
        displaySymbol: `${base}/${quote}`,
        querySymbol: metalToYahooSymbol(base),
        marketType: "forex",
      };
    }
    if (base && quote && base.length === 3 && quote.length === 3 && FX_CODES.has(base) && FX_CODES.has(quote)) {
      return {
        input,
        displaySymbol: `${base}/${quote}`,
        querySymbol: `${base}${quote}=X`,
        marketType: "forex",
      };
    }
    if (base && quote) {
      const normalizedQuote = quote === "USDT" ? "USD" : quote;
      return {
        input,
        displaySymbol: `${base}/${quote}`,
        querySymbol: `${base}-${normalizedQuote}`,
        marketType: quote === "USDT" || normalizedQuote === "USD" ? "crypto" : "unknown",
      };
    }
  }

  if (raw.endsWith("=X")) {
    return {
      input,
      displaySymbol: raw.replace("=X", ""),
      querySymbol: raw,
      marketType: "forex",
    };
  }

  if (/^[A-Z]{6}$/.test(raw)) {
    const base = raw.slice(0, 3);
    const quote = raw.slice(3, 6);
    if (METAL_CODES.has(base) && quote === "USD") {
      return {
        input,
        displaySymbol: `${base}/${quote}`,
        querySymbol: metalToYahooSymbol(base),
        marketType: "forex",
      };
    }
    if (FX_CODES.has(base) && FX_CODES.has(quote)) {
      return {
        input,
        displaySymbol: `${base}/${quote}`,
        querySymbol: `${base}${quote}=X`,
        marketType: "forex",
      };
    }
    if (quote === "USD" && !METAL_CODES.has(base)) {
      return {
        input,
        displaySymbol: `${base}/USD`,
        querySymbol: `${base}-USD`,
        marketType: "crypto",
      };
    }
  }

  if (/^[A-Z0-9]{2,12}USDT$/.test(raw)) {
    const base = raw.slice(0, -4);
    return {
      input,
      displaySymbol: `${base}/USDT`,
      querySymbol: `${base}-USD`,
      marketType: "crypto",
    };
  }

  if (/^[A-Z0-9]{2,12}-(USD|USDT|BTC|ETH)$/.test(raw)) {
    const normalized = raw.endsWith("-USDT") ? raw.replace("-USDT", "-USD") : raw;
    return {
      input,
      displaySymbol: raw,
      querySymbol: normalized,
      marketType: raw.includes("-USD") || raw.includes("-USDT") ? "crypto" : "unknown",
    };
  }

  return {
    input,
    displaySymbol: raw,
    querySymbol: raw,
    marketType: "stock",
  };
}

function getCached<T>(key: string): T | undefined {
  const cached = runtimeCache.get(key);
  if (!cached) return undefined;
  if (Date.now() >= cached.expiresAt) {
    runtimeCache.delete(key);
    return undefined;
  }
  return cached.value as T;
}

function setCached<T>(key: string, value: T, ttlMs = NEWS_CACHE_TTL_MS): void {
  runtimeCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function toTimestamp(value: string | undefined | null): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function isWithinFreshWindow(timestamp: number, freshnessMs = FRESH_NEWS_WINDOW_MS): boolean {
  const now = Date.now();
  if (timestamp > now + UPCOMING_NEWS_WINDOW_MS) return false;
  return now - timestamp <= freshnessMs;
}

function isFreshIsoDate(isoDate: string, freshnessMs = FRESH_NEWS_WINDOW_MS): boolean {
  const ts = toTimestamp(isoDate);
  return ts !== null ? isWithinFreshWindow(ts, freshnessMs) : false;
}

function parseFeedDate(pubDate: string): string | null {
  const ts = toTimestamp(pubDate);
  if (ts === null) return null;
  if (!isWithinFreshWindow(ts)) return null;
  return new Date(ts).toISOString();
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function parseRssItems(xml: string): Array<{ title: string; link: string; source: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; source: string; pubDate: string }> = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const block = match[1];
    const title = decodeXmlEntities(extractTag(block, "title")).replace(/\s+/g, " ").trim();
    const link = decodeXmlEntities(extractTag(block, "link"));
    const source = decodeXmlEntities(extractTag(block, "source")) || "News";
    const pubDate = extractTag(block, "pubDate");
    if (!title || !link) continue;
    items.push({ title, link, source, pubDate });
  }

  return items;
}

function inferNewsSentiment(title: string): "positive" | "negative" | "neutral" {
  const text = title.toLowerCase();
  const positive = ["rally", "surge", "beat", "upgrade", "bullish", "growth", "record high", "easing", "inflow"];
  const negative = ["war", "conflict", "attack", "terror", "downgrade", "miss", "selloff", "crash", "sanction", "risk"];
  if (positive.some((word) => text.includes(word))) return "positive";
  if (negative.some((word) => text.includes(word))) return "negative";
  return "neutral";
}

function buildNewsQueries(symbol: SymbolInfo): string[] {
  const base = symbol.displaySymbol.replace("/", " ");
  if (symbol.marketType === "forex") {
    return [
      `${base} forex fed ecb boj central bank inflation`,
      `${base} global macro economic outlook risk sentiment`,
      `${base} Bank Indonesia rupiah BI rate economic calendar`,
      `${base} high impact economic calendar today`,
    ];
  }
  if (symbol.marketType === "crypto") {
    return [
      `${base} crypto regulation sec etf flow`,
      `${base} bitcoin ethereum macro liquidity risk-on risk-off`,
      `${base} Indonesia Bappebti crypto regulation rupiah`,
      `${base} global crypto market economic outlook`,
    ];
  }
  return [
    `${base} stock earnings guidance federal reserve outlook`,
    `${base} global equity macro outlook inflation rates`,
    `${base} Indonesia stock market IDX IHSG ekonomi`,
    `${base} Bank Indonesia economic policy and rupiah`,
  ];
}

async function fetchGoogleNewsHeadlines(query: string, limit = 8): Promise<NewsHeadline[]> {
  const cacheKey = `rss:${query}:${limit}`;
  const cached = getCached<NewsHeadline[]>(cacheKey);
  if (cached) return cached;

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await withTimeout(
    fetch(url).then(async (resp) => {
      if (!resp.ok) throw new Error(`Google News RSS request failed (${resp.status})`);
      return resp.text();
    }),
    REQUEST_TIMEOUT_MS,
    "Google News RSS timeout",
  );

  const headlines = parseRssItems(xml)
    .map((item) => {
      const publishedAt = parseFeedDate(item.pubDate);
      if (!publishedAt) return null;
      return {
        title: item.title,
        link: item.link,
        source: item.source,
        publishedAt,
        sentiment: inferNewsSentiment(item.title),
        query,
      } satisfies NewsHeadline;
    })
    .filter((item): item is NewsHeadline => Boolean(item))
    .slice(0, limit);

  setCached(cacheKey, headlines);
  return headlines;
}

function mergeUniqueHeadlines(headlines: NewsHeadline[]): NewsHeadline[] {
  const seen = new Set<string>();
  const merged: NewsHeadline[] = [];
  for (const headline of headlines) {
    if (!isFreshIsoDate(headline.publishedAt)) continue;
    const key = `${headline.link}|${headline.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(headline);
  }
  return merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

async function fetchMarketHeadlines(symbol: SymbolInfo): Promise<NewsHeadline[]> {
  const queries = buildNewsQueries(symbol);
  const results = await Promise.all(
    queries.map((query) =>
      fetchGoogleNewsHeadlines(query, 10).catch(() => []),
    ),
  );
  const merged = mergeUniqueHeadlines(results.flat());
  if (merged.length >= 6) return merged.slice(0, 18);

  const broadFallbackQueries =
    symbol.marketType === "crypto"
      ? [
          "global crypto market news today",
          "US macro inflation fed and crypto sentiment",
          "Indonesia crypto regulation Bappebti market update",
        ]
      : symbol.marketType === "forex"
        ? [
            "global forex market moving news today",
            "US dollar fed inflation rates update",
            "Indonesia rupiah Bank Indonesia market update",
          ]
        : [
            "global stock market macro news today",
            "US economy fed inflation earnings updates",
            "Indonesia stock market IHSG ekonomi terbaru",
          ];

  const fallbackResults = await Promise.all(
    broadFallbackQueries.map((query) => fetchGoogleNewsHeadlines(query, 8).catch(() => [])),
  );

  return mergeUniqueHeadlines([...merged, ...fallbackResults.flat()]).slice(0, 18);
}

function inferImpactFromHeadline(title: string): "high" | "medium" | "low" {
  const text = title.toLowerCase();
  if (/(fomc|interest rate|nfp|cpi|inflation|gdp|earnings|geopolitical|war|terror|bank indonesia|bi rate|fed|ecb|boj|payroll|core pce)/.test(text)) return "high";
  if (/(pmi|jobless|manufacturing|guidance|regulation|sec|opec|rupiah|idr|ihsg|idx|bappebti|fiscal|bond yield)/.test(text)) return "medium";
  return "low";
}

function inferCurrencyFromText(text: string): string | undefined {
  const value = text.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/\bus\b|\bunited states\b|\bfed\b|\bdollar\b|\busd\b/, "USD"],
    [/\beuro\b|\becb\b|\beur\b/, "EUR"],
    [/\bboe\b|\bsterling\b|\bpound\b|\bgbp\b/, "GBP"],
    [/\bboj\b|\byen\b|\bjpy\b/, "JPY"],
    [/\baud\b|\baustralia\b|\brba\b/, "AUD"],
    [/\bnzd\b|\bnew zealand\b|\brbnz\b/, "NZD"],
    [/\bcad\b|\bcanada\b|\bboc\b/, "CAD"],
    [/\bchf\b|\bswiss\b|\bsnb\b/, "CHF"],
    [/\bgold\b|\bxau\b/, "XAU"],
    [/\bsilver\b|\bxag\b/, "XAG"],
    [/\bbitcoin\b|\bbtc\b/, "BTC"],
    [/\bethereum\b|\beth\b/, "ETH"],
    [/\bindonesia\b|\bjakarta\b|\brupiah\b|\bridr\b|\bbank indonesia\b|\bbi rate\b|\bihsg\b|\bidx\b/, "IDR"],
  ];
  for (const [pattern, currency] of map) {
    if (pattern.test(value)) return currency;
  }
  return undefined;
}

function buildCalendarFromHeadlines(headlines: NewsHeadline[]): CalendarItem[] {
  const tagged = headlines
    .filter((item) => isFreshIsoDate(item.publishedAt))
    .filter((item) => /(fomc|interest rate|nfp|cpi|inflation|earnings|gdp|pmi|jobless|opec|ecb|boj|fed|bank indonesia|bi rate|rupiah|idr|ihsg|idx|bappebti)/i.test(item.title))
    .slice(0, 10)
    .map((item) => ({
      event: item.title,
      impact: inferImpactFromHeadline(item.title),
      timestamp: item.publishedAt,
      source: item.source,
      currency: inferCurrencyFromText(item.title),
      link: item.link,
      isUpcoming: false,
    }));

  return tagged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function normalizeImpact(value: string): "high" | "medium" | "low" {
  const text = value.toLowerCase();
  if (text.includes("high")) return "high";
  if (text.includes("medium") || text.includes("med")) return "medium";
  return "low";
}

function normalizeCalendarDate(dateText: string): string {
  const cleaned = decodeXmlEntities(dateText).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
    const [month, day, year] = cleaned.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) {
    const [year, month, day] = cleaned.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  if (/^[A-Za-z]{3,9}\s+\d{1,2}$/.test(cleaned)) {
    return `${cleaned} ${new Date().getUTCFullYear()}`;
  }

  return cleaned;
}

function normalizeCalendarTime(timeText: string): string {
  const cleaned = decodeXmlEntities(timeText).replace(/\s+/g, " ").trim();
  if (!cleaned || /tentative|all day|day \d+/i.test(cleaned)) return "00:00";
  return cleaned.replace(/\./g, "");
}

function parseCalendarTimestamp(dateText: string, timeText: string): number | null {
  const datePart = normalizeCalendarDate(dateText);
  if (!datePart) return null;
  const timePart = normalizeCalendarTime(timeText);

  const candidates = [
    `${datePart} ${timePart} UTC`,
    `${datePart} UTC`,
    `${datePart} ${timePart}`,
    datePart,
  ];

  for (const candidate of candidates) {
    const ts = Date.parse(candidate);
    if (Number.isFinite(ts)) return ts;
  }

  return null;
}

function parseForexFactoryCalendar(xml: string): CalendarItem[] {
  const events: CalendarItem[] = [];
  const regex = /<event>([\s\S]*?)<\/event>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const block = match[1];
    const event = decodeXmlEntities(extractTag(block, "title") || extractTag(block, "event")).replace(/\s+/g, " ").trim();
    const country = decodeXmlEntities(extractTag(block, "country")).trim().toUpperCase();
    const dateText = extractTag(block, "date");
    const timeText = extractTag(block, "time");
    const impactText = extractTag(block, "impact");
    const link = decodeXmlEntities(extractTag(block, "url") || extractTag(block, "link"));
    const timestamp = parseCalendarTimestamp(dateText, timeText);

    if (!event || timestamp === null) continue;
    if (!isWithinFreshWindow(timestamp)) continue;

    events.push({
      event,
      impact: normalizeImpact(impactText),
      timestamp: new Date(timestamp).toISOString(),
      source: "ForexFactory",
      currency: country || undefined,
      link: link || undefined,
      isUpcoming: timestamp > Date.now(),
    });
  }

  return events;
}

function getSymbolCurrencies(symbol: SymbolInfo): string[] {
  const display = symbol.displaySymbol.toUpperCase();
  if (display.endsWith(".JK")) {
    return ["IDR", "USD"];
  }
  if (symbol.marketType === "forex") {
    const pair = display.replace("=X", "").replace("/", "");
    if (pair.length >= 6) return [pair.slice(0, 3), pair.slice(3, 6)];
  }
  if (symbol.marketType === "crypto") {
    if (display.includes("/")) {
      const [base, quote] = display.split("/");
      return [base, quote];
    }
    if (display.includes("-")) {
      const [base, quote] = display.split("-");
      return [base, quote];
    }
  }
  return ["USD"];
}

function mergeCalendarItems(items: CalendarItem[]): CalendarItem[] {
  const seen = new Set<string>();
  const merged: CalendarItem[] = [];

  for (const item of items) {
    if (!isFreshIsoDate(item.timestamp)) continue;
    const key = `${item.event}|${item.timestamp}|${item.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...item,
      isUpcoming: toTimestamp(item.timestamp)! > Date.now(),
    });
  }

  return merged.sort((a, b) => {
    const at = toTimestamp(a.timestamp) ?? 0;
    const bt = toTimestamp(b.timestamp) ?? 0;
    const an = a.isUpcoming ? 0 : 1;
    const bn = b.isUpcoming ? 0 : 1;
    if (an !== bn) return an - bn;
    return an === 0 ? at - bt : bt - at;
  });
}

async function fetchEconomicCalendar(symbol: SymbolInfo): Promise<CalendarItem[]> {
  const cacheKey = `econ:${symbol.querySymbol}`;
  const cached = getCached<CalendarItem[]>(cacheKey);
  if (cached) return cached;

  const fallbackQueries = [
    "US economic calendar today fed cpi nfp",
    "global economic calendar today central bank",
    "Indonesia economic calendar Bank Indonesia rupiah inflasi",
  ];

  const [forexFactoryEvents, fallbackResults] = await Promise.all([
    withTimeout(
      fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.xml").then(async (resp) => {
        if (!resp.ok) throw new Error(`ForexFactory calendar failed (${resp.status})`);
        return resp.text();
      }),
      REQUEST_TIMEOUT_MS,
      "ForexFactory calendar timeout",
    )
      .then((xml) => parseForexFactoryCalendar(xml))
      .catch(() => []),
    Promise.all(fallbackQueries.map((query) => fetchGoogleNewsHeadlines(query, 10).catch(() => []))),
  ]);

  const symbolCurrencies = getSymbolCurrencies(symbol);
  const fallbackHeadlines = mergeUniqueHeadlines(fallbackResults.flat());
  const headlineCalendar = buildCalendarFromHeadlines(fallbackHeadlines).map((item) => ({
    ...item,
    source: `${item.source} (News)`,
  }));

  const allowedCurrencies = new Set([...symbolCurrencies, "USD", "IDR"]);
  const merged = mergeCalendarItems([...forexFactoryEvents, ...headlineCalendar])
    .filter((item) => {
      if (!item.currency) return item.impact === "high";
      return allowedCurrencies.has(item.currency.toUpperCase());
    })
    .slice(0, 20);

  setCached(cacheKey, merged);
  return merged;
}

function buildIntelNarrative(symbol: SymbolInfo, headlines: NewsHeadline[], calendar: CalendarItem[]): IntelNarrative {
  const sentimentScore = headlines.reduce((sum, item) => {
    if (item.sentiment === "positive") return sum + 1;
    if (item.sentiment === "negative") return sum - 1;
    return sum;
  }, 0);

  const now = Date.now();
  const upcomingHighImpact = calendar.filter((item) => {
    if (item.impact !== "high") return false;
    const ts = toTimestamp(item.timestamp);
    if (ts === null) return false;
    return ts >= now && ts - now <= 24 * 60 * 60 * 1000;
  }).length;

  const recentHighImpact = calendar.filter((item) => {
    if (item.impact !== "high") return false;
    const ts = toTimestamp(item.timestamp);
    if (ts === null) return false;
    return ts < now && now - ts <= 24 * 60 * 60 * 1000;
  }).length;

  let bias: "bullish" | "bearish" | "neutral" = "neutral";
  if (sentimentScore >= 2) bias = "bullish";
  if (sentimentScore <= -2) bias = "bearish";

  let warningLevel: "high" | "medium" | "low" = "low";
  if (upcomingHighImpact >= 2) warningLevel = "high";
  else if (upcomingHighImpact === 1 || recentHighImpact >= 2) warningLevel = "medium";

  const strength = clamp(
    45 + Math.abs(sentimentScore) * 8 + upcomingHighImpact * 10 + recentHighImpact * 4,
    35,
    95,
  );

  const factors: string[] = [];
  factors.push(`${headlines.length} fresh headlines (<=48h) for ${symbol.displaySymbol}.`);
  if (sentimentScore > 0) factors.push("Headline sentiment skews positive.");
  if (sentimentScore < 0) factors.push("Headline sentiment skews risk-off.");
  if (upcomingHighImpact > 0) factors.push(`${upcomingHighImpact} high-impact event(s) due in next 24h.`);
  if (recentHighImpact > 0) factors.push(`${recentHighImpact} high-impact event(s) occurred in last 24h.`);
  if (!factors.length) factors.push("No strong catalyst concentration detected.");

  const summary =
    warningLevel === "high"
      ? "High-impact macro events are close. Prefer confirmation after news release before opening new positions."
      : warningLevel === "medium"
        ? "Catalyst risk is moderate. Keep position size smaller and avoid late entries."
        : bias === "bullish"
          ? "News flow is mildly supportive. Bias can lean long if price action confirms."
          : bias === "bearish"
            ? "News flow is defensive. Bias can lean short if structure breaks support."
            : "Mixed news flow. Wait for technical confirmation and avoid overtrading.";

  return {
    bias,
    warningLevel,
    strength: round(strength, 1),
    summary,
    factors: factors.slice(0, 5),
    sentimentScore,
    upcomingHighImpact,
    recentHighImpact,
  };
}

function buildIntelWarnings(
  narrative: IntelNarrative,
  headlines: NewsHeadline[],
  calendar: CalendarItem[],
): string[] {
  const warnings: string[] = [];
  if (!headlines.length) warnings.push("Fresh headline coverage is low. Treat signal quality as reduced.");
  if (!calendar.length) warnings.push("Economic calendar feed is limited right now. Cross-check manually before entry.");
  if (narrative.upcomingHighImpact > 0) {
    warnings.push(
      `${narrative.upcomingHighImpact} high-impact event(s) are scheduled in <24h. Spread/slippage can widen.`,
    );
  }
  if (narrative.warningLevel === "high") {
    warnings.push("Use strict risk controls: smaller size, wider buffer, and confirmation candle after release.");
  }
  return warnings.slice(0, 4);
}

function resolveFeedUpdatedAt(headlines: NewsHeadline[], calendar: CalendarItem[]): string {
  const timestamps = [
    ...headlines.map((item) => toTimestamp(item.publishedAt) ?? 0),
    ...calendar.map((item) => toTimestamp(item.timestamp) ?? 0),
  ].filter((value) => value > 0);
  if (!timestamps.length) return new Date().toISOString();
  return new Date(Math.max(...timestamps)).toISOString();
}

function classifyRegion(title: string): string {
  const text = title.toLowerCase();
  if (/(ukraine|russia|europe)/.test(text)) return "europe";
  if (/(gaza|israel|iran|middle east|yemen|syria)/.test(text)) return "middle-east";
  if (/(papua|opm|indonesia)/.test(text)) return "indonesia";
  if (/(china|taiwan|south china sea|korea|japan)/.test(text)) return "asia";
  if (/(africa|sahel|sudan)/.test(text)) return "africa";
  if (/(usa|united states|mexico|canada)/.test(text)) return "americas";
  return "global";
}

function classifyRiskLevel(title: string): "high" | "medium" | "low" {
  const text = title.toLowerCase();
  if (/(war|missile|attack|bomb|terror|hostage|strike|invasion|military escalation)/.test(text)) return "high";
  if (/(conflict|sanction|protest|clash|security alert)/.test(text)) return "medium";
  return "low";
}

async function fetchGeopoliticalEvents(): Promise<GeopoliticalEvent[]> {
  const cacheKey = "geo:events";
  const cached = getCached<GeopoliticalEvent[]>(cacheKey);
  if (cached) return cached;

  const queries = [
    "war conflict escalation",
    "terrorism attack security alert",
    "Papua OPM conflict",
    "military sanctions geopolitical risk",
  ];

  const results = await Promise.all(
    queries.map((query) => fetchGoogleNewsHeadlines(query, 10).catch(() => [])),
  );

  const events: GeopoliticalEvent[] = mergeUniqueHeadlines(results.flat())
    .filter((item) => isFreshIsoDate(item.publishedAt))
    .slice(0, 40)
    .map((item) => ({
      title: item.title,
      region: classifyRegion(item.title),
      riskLevel: classifyRiskLevel(item.title),
      publishedAt: item.publishedAt,
      source: item.source,
      link: item.link,
    }))
    .sort((a, b) => {
      const riskWeight = { high: 3, medium: 2, low: 1 };
      const rw = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
      if (rw !== 0) return rw;
      return (toTimestamp(b.publishedAt) ?? 0) - (toTimestamp(a.publishedAt) ?? 0);
    })
    .slice(0, 28);

  setCached(cacheKey, events);
  return events;
}

function resolveGeoUpdatedAt(events: GeopoliticalEvent[]): string {
  const timestamps = events
    .map((event) => toTimestamp(event.publishedAt) ?? 0)
    .filter((value) => value > 0);
  if (!timestamps.length) return new Date().toISOString();
  return new Date(Math.max(...timestamps)).toISOString();
}

function toFiniteNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function emptyInstitutionalSummary(): InstitutionalSummary {
  return {
    totalTracked: 0,
    buyActors: 0,
    sellActors: 0,
    holdActors: 0,
    buyFlowShares: 0,
    sellFlowShares: 0,
    dominantSide: "NEUTRAL",
    dominanceScore: 50,
    topBuyer: null,
    topSeller: null,
  };
}

function buildInstitutionalResponse(
  symbol: SymbolInfo,
  overrides: Partial<InstitutionalResponse>,
): InstitutionalResponse {
  return {
    symbol: symbol.displaySymbol,
    marketType: symbol.marketType,
    supported: true,
    updatedAt: new Date().toISOString(),
    insiderNetShares: null,
    insiderBuyShares: null,
    insiderSellShares: null,
    summary: emptyInstitutionalSummary(),
    rows: [],
    ...overrides,
  };
}

function normalizeInstitutionalRows(
  source: "institutionOwnership" | "fundOwnership",
  rows: any[],
): InstitutionalActor[] {
  return rows
    .map((item: any): InstitutionalActor | null => {
      const organization = typeof item?.organization === "string" ? item.organization.trim() : "";
      if (!organization) return null;

      const pctHeldRaw = toFiniteNumber(item?.pctHeld);
      const pctHeld = pctHeldRaw === null ? null : pctHeldRaw * 100;
      const pctChange = toFiniteNumber(item?.pctChange);
      const position = toFiniteNumber(item?.position);
      const value = toFiniteNumber(item?.value);
      const estimatedFlowShares =
        pctChange !== null && position !== null ? position * pctChange : null;

      let side: "BUY" | "SELL" | "HOLD" = "HOLD";
      if (estimatedFlowShares !== null) {
        if (estimatedFlowShares > 0) side = "BUY";
        if (estimatedFlowShares < 0) side = "SELL";
      }

      const reportDateRaw = item?.reportDate ? new Date(item.reportDate) : null;
      const reportDate =
        reportDateRaw && Number.isFinite(reportDateRaw.getTime())
          ? reportDateRaw.toISOString()
          : new Date().toISOString();

      return {
        organization,
        source,
        side,
        pctHeld,
        pctChange,
        position,
        value,
        estimatedFlowShares,
        reportDate,
      };
    })
    .filter((row): row is InstitutionalActor => Boolean(row))
    .sort((a, b) => {
      const av = Math.abs(a.estimatedFlowShares ?? 0);
      const bv = Math.abs(b.estimatedFlowShares ?? 0);
      return bv - av;
    });
}

function aggregateInstitutionalSummary(rows: InstitutionalActor[]): InstitutionalSummary {
  if (!rows.length) return emptyInstitutionalSummary();

  const buyRows = rows.filter((row) => row.side === "BUY");
  const sellRows = rows.filter((row) => row.side === "SELL");
  const holdRows = rows.filter((row) => row.side === "HOLD");

  const buyFlowShares = buyRows.reduce((sum, row) => sum + Math.max(row.estimatedFlowShares ?? 0, 0), 0);
  const sellFlowShares = sellRows.reduce((sum, row) => sum + Math.abs(Math.min(row.estimatedFlowShares ?? 0, 0)), 0);
  const totalFlow = buyFlowShares + sellFlowShares;

  let dominantSide: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  if (totalFlow > 0) {
    dominantSide = buyFlowShares > sellFlowShares ? "BUY" : buyFlowShares < sellFlowShares ? "SELL" : "NEUTRAL";
  }

  const topBuyer = buyRows.length
    ? buyRows.reduce((max, row) => ((row.estimatedFlowShares ?? 0) > (max.estimatedFlowShares ?? 0) ? row : max), buyRows[0]).organization
    : null;
  const topSeller = sellRows.length
    ? sellRows.reduce((max, row) => (Math.abs(row.estimatedFlowShares ?? 0) > Math.abs(max.estimatedFlowShares ?? 0) ? row : max), sellRows[0]).organization
    : null;

  return {
    totalTracked: rows.length,
    buyActors: buyRows.length,
    sellActors: sellRows.length,
    holdActors: holdRows.length,
    buyFlowShares: round(buyFlowShares, 0),
    sellFlowShares: round(sellFlowShares, 0),
    dominantSide,
    dominanceScore: round(totalFlow > 0 ? (Math.max(buyFlowShares, sellFlowShares) / totalFlow) * 100 : 50, 2),
    topBuyer,
    topSeller,
  };
}

async function fetchInstitutionalFlow(symbol: SymbolInfo): Promise<InstitutionalResponse> {
  if (symbol.marketType !== "stock") {
    return buildInstitutionalResponse(symbol, {
      supported: false,
      note: "Institutional ownership feed is available only for stock symbols.",
    });
  }

  const cacheKey = `institutional:${symbol.querySymbol}`;
  const cached = getCached<InstitutionalResponse>(cacheKey);
  if (cached) return cached;

  const yahooFinance = await getYahooFinanceClient();
  const modules = [
    "institutionOwnership",
    "fundOwnership",
    "netSharePurchaseActivity",
    "majorHoldersBreakdown",
  ];

  try {
    const summaryData = await withTimeout(
      yahooFinance.quoteSummary(symbol.querySymbol, { modules }),
      REQUEST_TIMEOUT_MS,
      "Yahoo Finance institutional data timeout",
    );

    const institutionRows = normalizeInstitutionalRows(
      "institutionOwnership",
      Array.isArray(summaryData?.institutionOwnership?.ownershipList)
        ? summaryData.institutionOwnership.ownershipList
        : [],
    );
    const fundRows = normalizeInstitutionalRows(
      "fundOwnership",
      Array.isArray(summaryData?.fundOwnership?.ownershipList)
        ? summaryData.fundOwnership.ownershipList
        : [],
    );

    const mergedRows = [...institutionRows, ...fundRows]
      .slice(0, 40)
      .sort((a, b) => Math.abs(b.estimatedFlowShares ?? 0) - Math.abs(a.estimatedFlowShares ?? 0));

    const activity = summaryData?.netSharePurchaseActivity ?? {};
    const result = buildInstitutionalResponse(symbol, {
      insiderNetShares: toFiniteNumber(activity.netInfoShares),
      insiderBuyShares: toFiniteNumber(activity.buyInfoShares),
      insiderSellShares: toFiniteNumber(activity.sellInfoShares),
      summary: aggregateInstitutionalSummary(mergedRows),
      rows: mergedRows,
      updatedAt: new Date().toISOString(),
      supported: mergedRows.length > 0,
      note: mergedRows.length ? undefined : "No institutional ownership rows found for this symbol.",
    });

    setCached(cacheKey, result, NEWS_CACHE_TTL_MS);
    return result;
  } catch (error: any) {
    return buildInstitutionalResponse(symbol, {
      supported: false,
      note: error?.message ?? "Institutional feed unavailable for this symbol.",
    });
  }
}

function getPeriod1(range: string): string {
  const date = new Date();
  switch (range) {
    case "1d":
      date.setDate(date.getDate() - 1);
      break;
    case "5d":
      date.setDate(date.getDate() - 5);
      break;
    case "1mo":
      date.setMonth(date.getMonth() - 1);
      break;
    case "3mo":
      date.setMonth(date.getMonth() - 3);
      break;
    case "6mo":
      date.setMonth(date.getMonth() - 6);
      break;
    case "1y":
      date.setFullYear(date.getFullYear() - 1);
      break;
    case "2y":
      date.setFullYear(date.getFullYear() - 2);
      break;
    case "5y":
      date.setFullYear(date.getFullYear() - 5);
      break;
    case "max":
      date.setFullYear(date.getFullYear() - 12);
      break;
    default:
      date.setMonth(date.getMonth() - 3);
  }
  return date.toISOString().split("T")[0];
}

async function fetchHistory(symbol: SymbolInfo, interval: string, range: string): Promise<Candle[]> {
  const yahooFinance = await getYahooFinanceClient();
  const queryOptions: any = {
    period1: getPeriod1(range),
    interval,
  };

  const result: any = await withTimeout(
    yahooFinance.chart(symbol.querySymbol, queryOptions),
    REQUEST_TIMEOUT_MS,
    "Yahoo Finance chart timeout",
  );

  const quotes = Array.isArray(result?.quotes) ? result.quotes : [];
  const candles: Candle[] = quotes
    .map((q: any) => {
      const date = new Date(q.date);
      return {
        date: Number.isFinite(date.getTime()) ? date.toISOString() : "",
        open: Number(q.open),
        high: Number(q.high),
        low: Number(q.low),
        close: Number(q.close),
        volume: Number(q.volume ?? 0),
      };
    })
    .filter((q: Candle) => {
      return (
        Number.isFinite(new Date(q.date).getTime()) &&
        Number.isFinite(q.open) &&
        Number.isFinite(q.high) &&
        Number.isFinite(q.low) &&
        Number.isFinite(q.close) &&
        q.close > 0 &&
        q.high >= q.low
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!candles.length) {
    throw new Error(`No valid historical data found for ${symbol.querySymbol}`);
  }

  return candles;
}

async function fetchQuote(symbol: SymbolInfo): Promise<any> {
  const yahooFinance = await getYahooFinanceClient();
  const quote = await withTimeout(
    yahooFinance.quote(symbol.querySymbol),
    REQUEST_TIMEOUT_MS,
    "Yahoo Finance quote timeout",
  );
  if (!quote) throw new Error(`Quote unavailable for ${symbol.querySymbol}`);
  return quote;
}

function buildAnalysis(
  candles: Candle[],
  symbol: SymbolInfo,
  interval: string,
  range: string,
  accountSize: number,
): AnalysisPayload {
  const signalCandles = getClosedSignalCandles(candles, interval);
  const signalLocked = signalCandles.length < candles.length;
  const core = generateCoreSignal(signalCandles);
  const backtest = runInstitutionalBacktest(candles, interval, symbol.marketType);
  const risk = buildRiskPlan(core, backtest, accountSize);

  let signal = core.signal;
  let confidence = core.confidence;
  const warnings = [...core.warnings];

  if (signalLocked) {
    warnings.unshift("Signal is locked to the latest closed candle (non-repaint mode).");
  }

  if (risk.killSwitch && signal !== "HOLD") {
    signal = "HOLD";
    confidence = Math.min(confidence, 58);
    warnings.push("Risk kill-switch active. New entries paused until quality improves.");
  }

  if (!risk.allowedTrade && signal !== "HOLD") {
    warnings.push("Risk filter blocks execution; wait for better setup quality.");
  }

  return {
    symbol: symbol.displaySymbol,
    normalizedSymbol: symbol.querySymbol,
    marketType: symbol.marketType,
    interval,
    range,
    signalLocked,
    signalCandleTime: signalCandles[signalCandles.length - 1]?.date ?? candles[candles.length - 1]?.date ?? "",
    signal,
    confidence,
    entry: round(core.entry, 6),
    stopLoss: round(core.stopLoss, 6),
    takeProfit1: round(core.takeProfit1, 6),
    takeProfit2: round(core.takeProfit2, 6),
    riskReward: round(core.riskReward, 2),
    atr: round(core.atr, 6),
    rsi: round(core.rsi, 2),
    emaFast: round(core.emaFast, 6),
    emaSlow: round(core.emaSlow, 6),
    trend: core.trend,
    reason: core.reason,
    warnings,
    ensemble: core.ensemble,
    backtest,
    risk,
  };
}

function generateCoreSignal(candles: Candle[]): CoreSignalResult {
  const fallbackEnsemble: EnsembleResult = {
    score: 0,
    bullishScore: 0,
    bearishScore: 0,
    confidence: 45,
    consensus: 0,
    signal: "HOLD",
    regime: { state: "range", trendStrength: 0, volatilityPct: 0, volumeRatio: 1 },
    votes: [],
  };

  if (candles.length < MIN_CANDLES_FOR_MODEL) {
    const last = candles[candles.length - 1];
    const entry = last?.close ?? 0;
    return {
      signal: "HOLD",
      confidence: 45,
      entry,
      stopLoss: entry * 0.99,
      takeProfit1: entry * 1.01,
      takeProfit2: entry * 1.02,
      riskReward: 1,
      atr: 0,
      rsi: 50,
      emaFast: entry,
      emaSlow: entry,
      trend: "Sideways",
      reason: ["Insufficient candles for institutional signal model."],
      warnings: ["Need more bars before model quality is reliable."],
      ensemble: fallbackEnsemble,
    };
  }

  const ind = computeIndicatorSnapshot(candles);
  const ensemble = buildEnsembleSignal(ind);
  const entry = ind.lastClose;

  let signal = ensemble.signal;
  let confidence = clamp(Math.round(ensemble.confidence), 45, 92);

  const volatilityMult =
    ensemble.regime.state === "high_volatility" ? 1.35 : ensemble.regime.state === "trending" ? 1.05 : 0.95;
  const riskDistance = Math.max(ind.atr14 * volatilityMult, entry * 0.0035);

  let stopLoss = entry - riskDistance;
  let takeProfit1 = entry + riskDistance * 1.4;
  let takeProfit2 = entry + riskDistance * (2.1 + confidence / 100);

  if (signal === "SELL") {
    stopLoss = entry + riskDistance;
    takeProfit1 = entry - riskDistance * 1.4;
    takeProfit2 = entry - riskDistance * (2.1 + confidence / 100);
  }

  if (signal === "HOLD") {
    stopLoss = entry - riskDistance;
    takeProfit1 = entry + riskDistance;
    takeProfit2 = entry + riskDistance * 1.8;
  }

  const trend: "Bullish" | "Bearish" | "Sideways" =
    ind.ema21 > ind.ema50 ? "Bullish" : ind.ema21 < ind.ema50 ? "Bearish" : "Sideways";
  const legacy = legacySmaSignal(candles);

  const topVotes = [...ensemble.votes].sort((a, b) => Math.abs(b.score * b.weight) - Math.abs(a.score * a.weight)).slice(0, 3);
  const reason = topVotes.length
    ? topVotes.map((vote) => `${vote.name.replace("_", " ")}: ${vote.reason}`)
    : ["Strategy consensus is mixed; no directional edge."];
  reason.push(`legacy sma: ${legacy.reason}`);

  const warnings: string[] = [];
  if (ensemble.regime.state === "high_volatility") {
    warnings.push("High volatility regime: execution noise and slippage risk are elevated.");
  }
  if (ensemble.consensus < 0.5) {
    warnings.push("Strategy consensus is weak. Wait for stronger agreement.");
  }
  if (Math.abs(ensemble.score) < 0.18) {
    signal = "HOLD";
    confidence = Math.min(confidence, 56);
    warnings.push("Ensemble edge is too small for a directional trade.");
  }

  if (legacy.signal !== "HOLD" && signal !== "HOLD") {
    if (legacy.signal === signal) {
      confidence = clamp(confidence + 3, 45, 92);
    } else {
      confidence = clamp(confidence - 6, 45, 92);
      warnings.push("Legacy baseline conflicts with ensemble direction.");
      if (ensemble.consensus < 0.65) {
        signal = "HOLD";
        warnings.push("Conflict filter set signal to HOLD to avoid floating direction changes.");
      }
    }
  }

  const denominator = Math.abs(entry - stopLoss) || 1;
  const riskReward = Math.abs((takeProfit2 - entry) / denominator);

  return {
    signal,
    confidence,
    entry,
    stopLoss,
    takeProfit1,
    takeProfit2,
    riskReward,
    atr: ind.atr14,
    rsi: ind.rsi14,
    emaFast: ind.ema9,
    emaSlow: ind.ema21,
    trend,
    reason,
    warnings,
    ensemble,
  };
}

function computeIndicatorSnapshot(candles: Candle[]): IndicatorSnapshot {
  const closes = candles.map((x) => x.close);
  const volumes = candles.map((x) => x.volume || 0);
  const highs = candles.map((x) => x.high);
  const lows = candles.map((x) => x.low);

  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const ema50 = ema(closes, 50);
  const sma20 = average(closes.slice(-20));
  const std20 = stdDev(closes.slice(-20));
  const rsi14 = rsi(closes, 14);
  const atr14 = atr(candles, 14);
  const roc5 = pctChange(closes[closes.length - 1], closes[Math.max(0, closes.length - 6)]);
  const roc14 = pctChange(closes[closes.length - 1], closes[Math.max(0, closes.length - 15)]);

  const ema12Series = emaSeries(closes, 12);
  const ema26Series = emaSeries(closes, 26);
  const macdSeries = ema12Series.map((value, idx) => value - ema26Series[idx]);
  const macdSignalSeries = emaSeries(macdSeries, 9);
  const macd = macdSeries[macdSeries.length - 1] ?? 0;
  const macdSignal = macdSignalSeries[macdSignalSeries.length - 1] ?? 0;
  const macdHist = macd - macdSignal;

  const highWindow = highs.slice(-21, -1);
  const lowWindow = lows.slice(-21, -1);
  const donchianHigh = highWindow.length ? Math.max(...highWindow) : highs[highs.length - 1];
  const donchianLow = lowWindow.length ? Math.min(...lowWindow) : lows[lows.length - 1];

  const avgVolume20 = average(volumes.slice(-20));
  const volumeRatio = avgVolume20 > 0 ? volumes[volumes.length - 1] / avgVolume20 : 1;
  const lastClose = closes[closes.length - 1];
  const trendStrength = Math.abs(ema21 - ema50) / Math.max(lastClose, 1e-8) * 100;
  const volatilityPct = atr14 / Math.max(lastClose, 1e-8) * 100;

  return {
    lastClose,
    ema9,
    ema21,
    ema50,
    sma20,
    std20,
    rsi14,
    atr14,
    roc5,
    roc14,
    macd,
    macdSignal,
    macdHist,
    donchianHigh,
    donchianLow,
    volumeRatio,
    trendStrength,
    volatilityPct,
  };
}

function buildEnsembleSignal(ind: IndicatorSnapshot): EnsembleResult {
  const regimeState: RegimeState =
    ind.volatilityPct >= 4.5 ? "high_volatility" : ind.trendStrength >= 1.1 ? "trending" : "range";

  const votes = [
    buildTrendVote(ind),
    buildMeanReversionVote(ind, regimeState),
    buildBreakoutVote(ind),
    buildMomentumVote(ind),
  ];

  const weights = getRegimeWeights(regimeState);
  votes.forEach((vote) => {
    vote.weight = weights[vote.name];
  });

  const score = votes.reduce((sum, vote) => sum + vote.score * vote.weight, 0);
  const bullishScore = votes.reduce((sum, vote) => sum + Math.max(0, vote.score) * vote.weight, 0);
  const bearishScore = votes.reduce((sum, vote) => sum + Math.max(0, -vote.score) * vote.weight, 0);

  const direction = score > 0 ? 1 : score < 0 ? -1 : 0;
  const agreeingVotes = direction === 0
    ? 0
    : votes.filter((vote) => Math.sign(vote.score) === direction && Math.abs(vote.score) >= 0.12).length;
  const consensus = votes.length ? agreeingVotes / votes.length : 0;

  let signal: Signal = "HOLD";
  if (score >= 0.2) signal = "BUY";
  if (score <= -0.2) signal = "SELL";

  let confidence = Math.round(48 + Math.abs(score) * 38 + consensus * 12);
  if (ind.volatilityPct > 5.5) confidence -= 5;
  confidence = clamp(confidence, 45, 90);

  return {
    score: round(score, 4),
    bullishScore: round(bullishScore, 4),
    bearishScore: round(bearishScore, 4),
    confidence,
    consensus: round(consensus, 4),
    signal,
    regime: {
      state: regimeState,
      trendStrength: round(ind.trendStrength, 4),
      volatilityPct: round(ind.volatilityPct, 4),
      volumeRatio: round(ind.volumeRatio, 4),
    },
    votes,
  };
}

function buildTrendVote(ind: IndicatorSnapshot): StrategyVote {
  const structure = (ind.ema9 > ind.ema21 ? 0.4 : -0.4) + (ind.ema21 > ind.ema50 ? 0.35 : -0.35);
  const location = ind.lastClose > ind.ema9 ? 0.25 : -0.25;
  const score = clamp(structure + location, -1, 1);
  const signal = score >= 0.2 ? "BUY" : score <= -0.2 ? "SELL" : "HOLD";
  const confidence = clamp(Math.round(52 + Math.abs(score) * 35 + ind.trendStrength * 6), 45, 90);
  return {
    name: "trend",
    score,
    signal,
    confidence,
    weight: 0,
    reason: signal === "BUY" ? "EMA structure aligned up." : signal === "SELL" ? "EMA structure aligned down." : "EMA structure is mixed.",
  };
}

function buildMeanReversionVote(ind: IndicatorSnapshot, regime: RegimeState): StrategyVote {
  const z = ind.std20 > 0 ? (ind.lastClose - ind.sma20) / (ind.std20 * 2) : 0;
  let score = 0;

  if (z <= -0.9 && ind.rsi14 <= 38) {
    score = clamp(Math.abs(z) * 0.65 + (40 - ind.rsi14) / 40, 0, 1);
  } else if (z >= 0.9 && ind.rsi14 >= 62) {
    score = -clamp(Math.abs(z) * 0.65 + (ind.rsi14 - 60) / 40, 0, 1);
  }

  if (regime === "trending") score *= 0.55;

  const signal = score >= 0.2 ? "BUY" : score <= -0.2 ? "SELL" : "HOLD";
  const confidence = clamp(Math.round(48 + Math.abs(score) * 32), 42, 84);
  return {
    name: "mean_reversion",
    score,
    signal,
    confidence,
    weight: 0,
    reason:
      signal === "BUY"
        ? "Price stretched below mean; rebound setup."
        : signal === "SELL"
          ? "Price stretched above mean; pullback setup."
          : "No meaningful mean-reversion edge.",
  };
}

function buildBreakoutVote(ind: IndicatorSnapshot): StrategyVote {
  let score = 0;
  if (ind.lastClose > ind.donchianHigh && ind.volumeRatio > 1.1) {
    score = clamp(0.45 + (ind.volumeRatio - 1) * 0.5 + Math.abs(ind.roc5) / 6, 0, 1);
  } else if (ind.lastClose < ind.donchianLow && ind.volumeRatio > 1.1) {
    score = -clamp(0.45 + (ind.volumeRatio - 1) * 0.5 + Math.abs(ind.roc5) / 6, 0, 1);
  }

  const signal = score >= 0.2 ? "BUY" : score <= -0.2 ? "SELL" : "HOLD";
  const confidence = clamp(Math.round(50 + Math.abs(score) * 36), 44, 88);
  return {
    name: "breakout",
    score,
    signal,
    confidence,
    weight: 0,
    reason: signal === "BUY" ? "Upside breakout confirmed by volume." : signal === "SELL" ? "Downside breakout confirmed by volume." : "No breakout confirmation.",
  };
}

function buildMomentumVote(ind: IndicatorSnapshot): StrategyVote {
  const rocScore = clamp(ind.roc14 / 5, -1, 1) * 0.55;
  const macdScore = clamp(ind.macdHist * 10, -1, 1) * 0.45;
  const score = clamp(rocScore + macdScore, -1, 1);
  const signal = score >= 0.2 ? "BUY" : score <= -0.2 ? "SELL" : "HOLD";
  const confidence = clamp(Math.round(48 + Math.abs(score) * 34), 42, 86);
  return {
    name: "momentum",
    score,
    signal,
    confidence,
    weight: 0,
    reason: signal === "BUY" ? "Momentum and MACD histogram support upside." : signal === "SELL" ? "Momentum and MACD histogram support downside." : "Momentum impulse is neutral.",
  };
}

function getRegimeWeights(regime: RegimeState): Record<StrategyName, number> {
  if (regime === "trending") {
    return { trend: 0.38, breakout: 0.3, momentum: 0.22, mean_reversion: 0.1 };
  }
  if (regime === "high_volatility") {
    return { trend: 0.25, breakout: 0.34, momentum: 0.26, mean_reversion: 0.15 };
  }
  return { trend: 0.2, breakout: 0.17, momentum: 0.27, mean_reversion: 0.36 };
}

function legacySmaSignal(candles: Candle[]): { signal: Signal; reason: string } {
  if (candles.length < 25) {
    return { signal: "HOLD", reason: "sma9/21 baseline unavailable (insufficient bars)." };
  }

  const closes = candles.map((x) => x.close);
  const sma9 = average(closes.slice(-9));
  const sma21 = average(closes.slice(-21));
  const lastClose = closes[closes.length - 1];

  if (sma9 > sma21 && lastClose > sma9) {
    return { signal: "BUY", reason: "sma9 above sma21 and price above sma9." };
  }
  if (sma9 < sma21 && lastClose < sma9) {
    return { signal: "SELL", reason: "sma9 below sma21 and price below sma9." };
  }

  return { signal: "HOLD", reason: "sma baseline neutral." };
}
function runInstitutionalBacktest(candles: Candle[], interval: string, marketType: MarketType): BacktestMetrics {
  if (candles.length < 80) return emptyBacktestMetrics();

  const folds: WalkForwardFold[] = [];
  const allTrades: BacktestTrade[] = [];
  const allCurve: EquityPoint[] = [];
  let equity = 100;
  let totalFees = 0;
  let totalSlippage = 0;
  let totalSpread = 0;
  let totalTestedBars = 0;
  let totalInMarketBars = 0;

  const trainBars = 160;
  const testBars = 80;
  const stepBars = 80;

  if (candles.length < trainBars + 30) {
    const warmup = Math.max(60, Math.floor(candles.length * 0.45));
    const segment = simulateBacktestSegment(candles, warmup, interval, marketType, equity);
    return buildBacktestSummary(
      segment.trades,
      segment.equityCurve,
      [],
      100,
      segment.endingEquity,
      candles[0]?.date,
      candles[candles.length - 1]?.date,
      segment.feesPaid,
      segment.slippagePaid,
      segment.spreadPaid,
      segment.testedBars,
      segment.inMarketBars,
    );
  }

  let foldId = 1;
  for (let start = 0; start + trainBars + 20 < candles.length; start += stepBars) {
    const end = Math.min(start + trainBars + testBars, candles.length - 1);
    const segmentCandles = candles.slice(start, end + 1);
    const segment = simulateBacktestSegment(segmentCandles, trainBars, interval, marketType, equity);

    const foldTrades = segment.trades;
    const foldWinRate = foldTrades.length ? round((foldTrades.filter((t) => t.rMultiple > 0).length / foldTrades.length) * 100, 2) : null;
    const foldNetPct = round((segment.endingEquity / equity - 1) * 100, 2);
    const foldPass = foldTrades.length >= 4 && foldNetPct > 0 && segment.maxDrawdown <= 10;

    folds.push({
      fold: foldId++,
      startDate: segmentCandles[trainBars]?.date ?? segmentCandles[0]?.date ?? "",
      endDate: segmentCandles[segmentCandles.length - 1]?.date ?? "",
      trades: foldTrades.length,
      winRate: foldWinRate,
      netProfitPct: foldNetPct,
      maxDrawdown: round(segment.maxDrawdown, 2),
      pass: foldPass,
    });

    equity = segment.endingEquity;
    totalFees += segment.feesPaid;
    totalSlippage += segment.slippagePaid;
    totalSpread += segment.spreadPaid;
    totalTestedBars += segment.testedBars;
    totalInMarketBars += segment.inMarketBars;
    allTrades.push(...foldTrades);

    if (!allCurve.length) allCurve.push(...segment.equityCurve);
    else allCurve.push(...segment.equityCurve.slice(1));

    if (end >= candles.length - 1) break;
  }

  return buildBacktestSummary(
    allTrades,
    allCurve,
    folds,
    100,
    equity,
    candles[0]?.date,
    candles[candles.length - 1]?.date,
    totalFees,
    totalSlippage,
    totalSpread,
    totalTestedBars,
    totalInMarketBars,
  );
}

function simulateBacktestSegment(
  candles: Candle[],
  warmupBars: number,
  interval: string,
  marketType: MarketType,
  startingEquity: number,
): SegmentResult {
  const friction = getFrictionModel(interval, marketType);
  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];
  const warmupIndex = clamp(Math.floor(warmupBars), 20, candles.length - 2);

  let equity = startingEquity;
  let peak = startingEquity;
  let maxDrawdown = 0;
  let feesPaid = 0;
  let slippagePaid = 0;
  let spreadPaid = 0;
  let testedBars = 0;
  let inMarketBars = 0;
  let cooldownBars = 0;
  let position: PositionState | null = null;

  equityCurve.push({ date: candles[warmupIndex]?.date ?? candles[0]?.date ?? "", equity: round(equity, 6), drawdown: 0 });

  for (let i = warmupIndex; i < candles.length - 1; i++) {
    testedBars += 1;
    const bar = candles[i];
    const history = candles.slice(0, i + 1);

    if (cooldownBars > 0) cooldownBars -= 1;

    if (position) {
      if (i < position.entryIndex) continue;
      position.barsHeld += 1;
      inMarketBars += 1;

      const stopHit = position.direction === 1 ? bar.low <= position.stopLoss : bar.high >= position.stopLoss;
      const tpHit = position.direction === 1 ? bar.high >= position.takeProfit : bar.low <= position.takeProfit;
      const maxBarsHit = position.barsHeld >= position.maxBars;

      let shouldExit = false;
      let exitReason = "";
      let exitRaw = bar.close;

      if (stopHit && tpHit) {
        shouldExit = true;
        exitReason = "stop_loss";
        exitRaw = position.stopLoss;
      } else if (stopHit) {
        shouldExit = true;
        exitReason = "stop_loss";
        exitRaw = position.stopLoss;
      } else if (tpHit) {
        shouldExit = true;
        exitReason = "take_profit";
        exitRaw = position.takeProfit;
      } else if (maxBarsHit) {
        shouldExit = true;
        exitReason = "time_exit";
      } else if (position.barsHeld >= 3) {
        const flipSignal = generateCoreSignal(history).signal;
        if ((position.direction === 1 && flipSignal === "SELL") || (position.direction === -1 && flipSignal === "BUY")) {
          shouldExit = true;
          exitReason = "signal_flip";
        }
      }

      if (shouldExit) {
        const exitFill = applyFill(exitRaw, position.direction, "exit", friction);
        const grossPnl = (exitFill - position.entryPrice) * position.direction * position.quantity;
        const totalNotional = Math.abs(position.entryPrice * position.quantity) + Math.abs(exitFill * position.quantity);
        const fees = totalNotional * friction.feePct;
        const slip = totalNotional * friction.slippagePct;
        const spread = totalNotional * (friction.spreadPct / 2);
        const netPnl = grossPnl - fees;

        equity += netPnl;
        feesPaid += fees;
        slippagePaid += slip;
        spreadPaid += spread;

        peak = Math.max(peak, equity);
        const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
        equityCurve.push({ date: bar.date, equity: round(equity, 6), drawdown: round(drawdown, 4) });

        const netReturnPct = position.riskCapital > 0 ? (netPnl / position.riskCapital) * 100 : 0;
        const rMultiple = position.riskCapital > 0 ? netPnl / position.riskCapital : 0;

        trades.push({
          entryDate: position.entryDate,
          exitDate: bar.date,
          direction: position.direction === 1 ? "LONG" : "SHORT",
          entry: round(position.entryPrice, 6),
          exit: round(exitFill, 6),
          riskCapital: round(position.riskCapital, 6),
          netPnl: round(netPnl, 6),
          netReturnPct: round(netReturnPct, 4),
          rMultiple: round(rMultiple, 4),
          barsHeld: position.barsHeld,
          exitReason,
        });

        if (rMultiple < 0) cooldownBars = 2;
        position = null;
      }
      continue;
    }

    if (cooldownBars > 0) continue;

    const signalData = generateCoreSignal(history);
    if (signalData.signal === "HOLD" || signalData.confidence < 58) continue;
    if (Math.abs(signalData.ensemble.score) < 0.3 || signalData.ensemble.consensus < 0.5) continue;
    if (signalData.signal === "BUY" && signalData.trend === "Bearish") continue;
    if (signalData.signal === "SELL" && signalData.trend === "Bullish") continue;

    const direction: 1 | -1 = signalData.signal === "BUY" ? 1 : -1;
    const nextBar = candles[i + 1];
    const entryRaw = nextBar.open || nextBar.close;
    const entryFill = applyFill(entryRaw, direction, "entry", friction);
    const stopDistance = Math.max(Math.abs(signalData.entry - signalData.stopLoss), entryFill * 0.0025);
    const riskPerTradePct = dynamicRiskBudgetPct(signalData);
    const riskCapital = equity * (riskPerTradePct / 100);

    if (riskCapital <= 0 || stopDistance <= 0) continue;

    const quantity = riskCapital / stopDistance;
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    const stopLoss = direction === 1 ? entryFill - stopDistance : entryFill + stopDistance;
    const tpMultiple = signalData.ensemble.regime.state === "range" ? 1.15 : 1.35;
    const takeProfit = direction === 1 ? entryFill + stopDistance * tpMultiple : entryFill - stopDistance * tpMultiple;

    position = {
      direction,
      entryDate: nextBar.date,
      entryIndex: i + 1,
      entryPrice: entryFill,
      stopLoss,
      takeProfit,
      riskCapital,
      quantity,
      maxBars: barsToHold(interval),
      barsHeld: 0,
    };
  }

  if (position) {
    const lastBar = candles[candles.length - 1];
    const exitFill = applyFill(lastBar.close, position.direction, "exit", friction);
    const grossPnl = (exitFill - position.entryPrice) * position.direction * position.quantity;
    const totalNotional = Math.abs(position.entryPrice * position.quantity) + Math.abs(exitFill * position.quantity);
    const fees = totalNotional * friction.feePct;
    const slip = totalNotional * friction.slippagePct;
    const spread = totalNotional * (friction.spreadPct / 2);
    const netPnl = grossPnl - fees;

    equity += netPnl;
    feesPaid += fees;
    slippagePaid += slip;
    spreadPaid += spread;
    peak = Math.max(peak, equity);
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    equityCurve.push({ date: lastBar.date, equity: round(equity, 6), drawdown: round(drawdown, 4) });

    const netReturnPct = position.riskCapital > 0 ? (netPnl / position.riskCapital) * 100 : 0;
    const rMultiple = position.riskCapital > 0 ? netPnl / position.riskCapital : 0;

    trades.push({
      entryDate: position.entryDate,
      exitDate: lastBar.date,
      direction: position.direction === 1 ? "LONG" : "SHORT",
      entry: round(position.entryPrice, 6),
      exit: round(exitFill, 6),
      riskCapital: round(position.riskCapital, 6),
      netPnl: round(netPnl, 6),
      netReturnPct: round(netReturnPct, 4),
      rMultiple: round(rMultiple, 4),
      barsHeld: position.barsHeld,
      exitReason: "end_of_data",
    });
  }

  return {
    trades,
    equityCurve,
    endingEquity: equity,
    maxDrawdown,
    feesPaid,
    slippagePaid,
    spreadPaid,
    testedBars,
    inMarketBars,
  };
}

function buildBacktestSummary(
  trades: BacktestTrade[],
  equityCurve: EquityPoint[],
  folds: WalkForwardFold[],
  startingEquity: number,
  endingEquity: number,
  firstDate?: string,
  lastDate?: string,
  feesPaid = 0,
  slippagePaid = 0,
  spreadPaid = 0,
  testedBars = 0,
  inMarketBars = 0,
): BacktestMetrics {
  if (!trades.length) return emptyBacktestMetrics(folds);

  const rValues = trades.map((t) => t.rMultiple);
  const wins = trades.filter((t) => t.rMultiple > 0);
  const losses = trades.filter((t) => t.rMultiple <= 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.netPnl, 0);
  const grossLoss = losses.reduce((sum, t) => sum + t.netPnl, 0);
  const winRate = (wins.length / trades.length) * 100;
  const expectancyR = average(rValues);
  const avgWinR = wins.length ? average(wins.map((t) => t.rMultiple)) : null;
  const avgLossR = losses.length ? average(losses.map((t) => t.rMultiple)) : null;
  const payoff = avgWinR !== null && avgLossR !== null && avgLossR !== 0 ? Math.abs(avgWinR / avgLossR) : null;
  const profitFactor = grossLoss < 0 ? grossProfit / Math.abs(grossLoss) : null;

  const maxDrawdown = equityCurve.length ? Math.max(...equityCurve.map((x) => x.drawdown)) : null;
  const maxConsecutiveLosses = calculateMaxConsecutiveLosses(rValues);

  const years = estimateYears(firstDate, lastDate);
  const netProfitPct = startingEquity > 0 ? ((endingEquity - startingEquity) / startingEquity) * 100 : null;
  const cagr = years > 0 && endingEquity > 0 ? (Math.pow(endingEquity / startingEquity, 1 / years) - 1) * 100 : null;

  const returns = trades.map((t) => t.netReturnPct / 100);
  const sharpe = calculateSharpe(returns, years, trades.length);
  const sortino = calculateSortino(returns, years, trades.length);
  const calmar = cagr !== null && maxDrawdown !== null && maxDrawdown > 0 ? cagr / maxDrawdown : null;
  const recoveryFactor = netProfitPct !== null && maxDrawdown !== null && maxDrawdown > 0 ? netProfitPct / maxDrawdown : null;
  const exposurePct = testedBars > 0 ? (inMarketBars / testedBars) * 100 : null;
  const passRate = folds.length ? (folds.filter((f) => f.pass).length / folds.length) * 100 : null;

  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: round(winRate, 2),
    maxDrawdown: maxDrawdown === null ? null : round(maxDrawdown, 2),
    expectancyR: round(expectancyR, 4),
    avgTradeR: round(expectancyR, 4),
    avgWinR: avgWinR === null ? null : round(avgWinR, 4),
    avgLossR: avgLossR === null ? null : round(avgLossR, 4),
    payoff: payoff === null ? null : round(payoff, 3),
    profitFactor: profitFactor === null ? null : round(profitFactor, 3),
    sharpe: sharpe === null ? null : round(sharpe, 3),
    sortino: sortino === null ? null : round(sortino, 3),
    calmar: calmar === null ? null : round(calmar, 3),
    cagr: cagr === null ? null : round(cagr, 3),
    recoveryFactor: recoveryFactor === null ? null : round(recoveryFactor, 3),
    exposurePct: exposurePct === null ? null : round(exposurePct, 2),
    netProfitPct: netProfitPct === null ? null : round(netProfitPct, 3),
    maxConsecutiveLosses,
    walkForwardPassRate: passRate === null ? null : round(passRate, 2),
    walkForwardFolds: folds.length,
    feesPaidPct: round((feesPaid / startingEquity) * 100, 3),
    slippagePaidPct: round((slippagePaid / startingEquity) * 100, 3),
    spreadPaidPct: round((spreadPaid / startingEquity) * 100, 3),
    folds,
    equityCurve: downsampleCurve(equityCurve, 180),
    lastTrades: trades.slice(-12),
  };
}

function emptyBacktestMetrics(folds: WalkForwardFold[] = []): BacktestMetrics {
  return {
    trades: 0,
    wins: 0,
    losses: 0,
    winRate: null,
    maxDrawdown: null,
    expectancyR: null,
    avgTradeR: null,
    avgWinR: null,
    avgLossR: null,
    payoff: null,
    profitFactor: null,
    sharpe: null,
    sortino: null,
    calmar: null,
    cagr: null,
    recoveryFactor: null,
    exposurePct: null,
    netProfitPct: null,
    maxConsecutiveLosses: 0,
    walkForwardPassRate: null,
    walkForwardFolds: folds.length,
    feesPaidPct: null,
    slippagePaidPct: null,
    spreadPaidPct: null,
    folds,
    equityCurve: [],
    lastTrades: [],
  };
}

function buildRiskPlan(core: CoreSignalResult, backtest: BacktestMetrics, accountSize: number): RiskPlan {
  const stopDistancePct = core.entry > 0 ? (Math.abs(core.entry - core.stopLoss) / core.entry) * 100 : 0;
  const confidenceFactor = clamp(core.confidence / 100, 0.45, 0.95);

  let riskPerTradePct = 0.9 * confidenceFactor;
  if (core.ensemble.regime.state === "high_volatility") riskPerTradePct *= 0.65;
  if (core.ensemble.regime.state === "range") riskPerTradePct *= 0.85;
  if (backtest.maxDrawdown !== null && backtest.maxDrawdown > 8) riskPerTradePct *= 0.75;
  if (backtest.profitFactor !== null && backtest.profitFactor < 1.15) riskPerTradePct *= 0.8;
  if (backtest.sharpe !== null && backtest.sharpe < 0.7) riskPerTradePct *= 0.85;

  riskPerTradePct = clamp(riskPerTradePct, 0.2, 1.25);

  const stopDistanceFraction = Math.max(stopDistancePct / 100, 0.002);
  const rawPositionPct = (riskPerTradePct / 100) / stopDistanceFraction * 100;
  const suggestedPositionPct = clamp(rawPositionPct, 0, 40);
  const confidenceAdjustedRisk = clamp(riskPerTradePct * confidenceFactor, 0.15, 1.2);

  const killSwitch =
    (backtest.maxDrawdown !== null && backtest.maxDrawdown > 15) ||
    (backtest.profitFactor !== null && backtest.profitFactor < 0.9) ||
    backtest.maxConsecutiveLosses >= 6;

  const allowedTrade =
    !killSwitch &&
    core.signal !== "HOLD" &&
    core.confidence >= 54 &&
    (backtest.trades >= 12 ? (backtest.profitFactor ?? 0) >= 0.98 : true);

  const notes: string[] = [];
  if (killSwitch) notes.push("Kill-switch active due to degraded historical quality.");
  if (!allowedTrade) notes.push("Setup blocked by risk filter; wait for better conditions.");
  if (core.ensemble.regime.state === "high_volatility") notes.push("Reduce leverage in high-volatility regime.");
  if (backtest.walkForwardPassRate !== null && backtest.walkForwardPassRate < 55) {
    notes.push("Walk-forward stability is weak. Prefer paper-trade mode.");
  }

  const maxPortfolioRiskPct = clamp(riskPerTradePct * 3, 1, 3);
  const dailyLossLimitPct = clamp(maxPortfolioRiskPct * 0.8, 0.8, 2.5);
  const maxOpenPositions = core.ensemble.regime.state === "high_volatility" ? 2 : 4;
  const _notional = (suggestedPositionPct / 100) * accountSize;
  void _notional;

  return {
    killSwitch,
    allowedTrade,
    riskPerTradePct: round(riskPerTradePct, 3),
    suggestedPositionPct: round(suggestedPositionPct, 2),
    maxPortfolioRiskPct: round(maxPortfolioRiskPct, 2),
    dailyLossLimitPct: round(dailyLossLimitPct, 2),
    maxOpenPositions,
    stopDistancePct: round(stopDistancePct, 3),
    confidenceAdjustedRisk: round(confidenceAdjustedRisk, 3),
    notes,
  };
}

function getFrictionModel(interval: string, marketType: MarketType): FrictionModel {
  const baseByMarket: Record<MarketType, FrictionModel> = {
    stock: { feePct: 0.00008, slippagePct: 0.00022, spreadPct: 0.00016 },
    forex: { feePct: 0.00005, slippagePct: 0.00018, spreadPct: 0.00014 },
    crypto: { feePct: 0.0004, slippagePct: 0.00035, spreadPct: 0.00025 },
    unknown: { feePct: 0.00015, slippagePct: 0.0003, spreadPct: 0.0002 },
  };

  const model = baseByMarket[marketType] ?? baseByMarket.unknown;
  const intervalFactor = interval.includes("m") && !interval.includes("mo") ? 1.35 : interval.includes("h") ? 1.2 : 1;
  return {
    feePct: model.feePct,
    slippagePct: model.slippagePct * intervalFactor,
    spreadPct: model.spreadPct * intervalFactor,
  };
}

function applyFill(price: number, direction: 1 | -1, mode: "entry" | "exit", friction: FrictionModel): number {
  const edge = friction.slippagePct + friction.spreadPct / 2;
  if (mode === "entry") return direction === 1 ? price * (1 + edge) : price * (1 - edge);
  return direction === 1 ? price * (1 - edge) : price * (1 + edge);
}

function dynamicRiskBudgetPct(signal: CoreSignalResult): number {
  let risk = 0.45 + (signal.confidence - 45) * 0.012;
  if (signal.ensemble.regime.state === "high_volatility") risk *= 0.65;
  if (signal.ensemble.consensus < 0.5) risk *= 0.8;
  return clamp(risk, 0.2, 1.1);
}

function barsToHold(interval: string): number {
  if (interval === "1m" || interval === "2m") return 90;
  if (interval === "5m") return 70;
  if (interval === "15m") return 56;
  if (interval === "30m") return 42;
  if (interval === "60m" || interval === "1h") return 30;
  if (interval === "1d") return 18;
  if (interval === "1wk") return 10;
  if (interval === "1mo") return 8;
  return 24;
}

function buildLocalChatResponse(message: string, context: any): string {
  const analysis = context?.analysis ?? {};
  const signal = (analysis.signal ?? context?.signal ?? "HOLD") as Signal;
  const confidence = typeof analysis.confidence === "number" ? `${analysis.confidence}%` : "n/a";
  const entry = formatNumber(analysis.entry ?? context?.price);
  const stopLoss = formatNumber(analysis.stopLoss);
  const takeProfit1 = formatNumber(analysis.takeProfit1);
  const takeProfit2 = formatNumber(analysis.takeProfit2);
  const winRate = formatNumber(analysis?.backtest?.winRate, 2);
  const drawdown = formatNumber(analysis?.backtest?.maxDrawdown, 2);
  const sharpe = formatNumber(analysis?.backtest?.sharpe, 2);
  const riskPerTrade = formatNumber(analysis?.risk?.riskPerTradePct, 2);
  const positionSize = formatNumber(analysis?.risk?.suggestedPositionPct, 2);
  const reasons = Array.isArray(analysis?.reason) ? analysis.reason.slice(0, 3) : [];

  const reasonBlock = reasons.length
    ? reasons.map((item: string) => `- ${item}`).join("\n")
    : "- Strategy votes are mixed; wait for confirmation.";

  return `### Market Bias
- Symbol: **${context?.symbol ?? "Unknown"}**
- Signal: **${signal}**
- Confidence: **${confidence}**

### Trade Plan
- Entry: **${entry}**
- Stop Loss: **${stopLoss}**
- TP1: **${takeProfit1}**
- TP2: **${takeProfit2}**

### Risk Controls
- Risk per trade: **${riskPerTrade}%**
- Suggested position size: **${positionSize}% of equity**

### Notes
${reasonBlock}
- Backtest snapshot: win rate **${winRate}%**, max drawdown **${drawdown}%**, Sharpe **${sharpe}**.
- User question: "${message.slice(0, 120)}"

_This analysis is educational only and not financial advice._`;
}

function ema(values: number[], period: number): number {
  if (!values.length) return 0;
  const k = 2 / (period + 1);
  let current = values[0];
  for (let i = 1; i < values.length; i++) {
    current = values[i] * k + current * (1 - k);
  }
  return current;
}

function emaSeries(values: number[], period: number): number[] {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

function rsi(values: number[], period: number): number {
  if (values.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function atr(candles: Candle[], period: number): number {
  if (candles.length < 2) return 0;

  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close),
    );
    tr.push(trueRange);
  }

  if (!tr.length) return 0;
  if (tr.length <= period) return average(tr);

  let value = average(tr.slice(0, period));
  for (let i = period; i < tr.length; i++) {
    value = (value * (period - 1) + tr[i]) / period;
  }
  return value;
}

function stdDev(values: number[]): number {
  if (!values.length) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, x) => sum + x, 0) / values.length;
}

function pctChange(current: number, reference: number): number {
  if (!Number.isFinite(reference) || reference === 0) return 0;
  return ((current - reference) / Math.abs(reference)) * 100;
}

function calculateMaxConsecutiveLosses(rValues: number[]): number {
  let maxLosses = 0;
  let current = 0;
  for (const value of rValues) {
    if (value <= 0) {
      current += 1;
      maxLosses = Math.max(maxLosses, current);
    } else {
      current = 0;
    }
  }
  return maxLosses;
}

function calculateSharpe(returns: number[], years: number, trades: number): number | null {
  if (returns.length < 2) return null;
  const mean = average(returns);
  const stdev = stdDev(returns);
  if (stdev === 0) return null;
  const tradesPerYear = years > 0 ? trades / years : trades;
  return (mean / stdev) * Math.sqrt(Math.max(tradesPerYear, 1));
}

function calculateSortino(returns: number[], years: number, trades: number): number | null {
  if (returns.length < 2) return null;
  const mean = average(returns);
  const downside = returns.filter((r) => r < 0);
  if (!downside.length) return null;
  const downsideDeviation = Math.sqrt(average(downside.map((r) => r ** 2)));
  if (downsideDeviation === 0) return null;
  const tradesPerYear = years > 0 ? trades / years : trades;
  return (mean / downsideDeviation) * Math.sqrt(Math.max(tradesPerYear, 1));
}

function estimateYears(firstDate?: string, lastDate?: string): number {
  if (!firstDate || !lastDate) return 1;
  const first = new Date(firstDate).getTime();
  const last = new Date(lastDate).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) return 1;
  return Math.max((last - first) / (365.25 * 24 * 60 * 60 * 1000), 1 / 12);
}

function downsampleCurve(curve: EquityPoint[], maxPoints: number): EquityPoint[] {
  if (curve.length <= maxPoints) {
    return curve.map((point) => ({
      date: point.date,
      equity: round(point.equity, 6),
      drawdown: round(point.drawdown, 4),
    }));
  }

  const step = Math.ceil(curve.length / maxPoints);
  const sampled = curve.filter((_item, idx) => idx % step === 0);
  const last = curve[curve.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);

  return sampled.map((point) => ({
    date: point.date,
    equity: round(point.equity, 6),
    drawdown: round(point.drawdown, 4),
  }));
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.max(minValue, Math.min(maxValue, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatNumber(value: unknown, decimals = 4): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return value.toFixed(decimals);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === "1" || process.env.NETLIFY === "true" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

if (!isServerlessRuntime()) {
  startServer().catch((error) => {
    console.error("Fatal server startup error:", error);
    process.exit(1);
  });
}
