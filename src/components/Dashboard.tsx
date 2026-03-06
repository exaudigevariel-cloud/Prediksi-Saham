import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Search,
  Zap,
  Palette,
  Code2,
  Maximize2,
  Minimize2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Crosshair,
} from 'lucide-react';
import Chart from './Chart';
import TradingViewPanel from './TradingViewPanel';
import SignalCard from './SignalCard';
import FloatingChat from './FloatingChat';
import PerformancePanel from './PerformancePanel';

type Signal = 'BUY' | 'SELL' | 'HOLD';

interface TimeframeConfig {
  label: string;
  value: string;
  interval: string;
  range: string;
}

interface BacktestMetrics {
  trades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  maxDrawdown: number | null;
  expectancyR: number | null;
  avgTradeR?: number | null;
  avgWinR?: number | null;
  avgLossR?: number | null;
  payoff?: number | null;
  profitFactor?: number | null;
  sharpe?: number | null;
  sortino?: number | null;
  calmar?: number | null;
  cagr?: number | null;
  recoveryFactor?: number | null;
  exposurePct?: number | null;
  netProfitPct?: number | null;
  maxConsecutiveLosses?: number;
  walkForwardPassRate?: number | null;
  walkForwardFolds?: number;
  feesPaidPct?: number | null;
  slippagePaidPct?: number | null;
  spreadPaidPct?: number | null;
  folds?: Array<{
    fold: number;
    trades: number;
    winRate: number | null;
    netProfitPct: number;
    maxDrawdown: number | null;
    pass: boolean;
  }>;
  equityCurve?: Array<{
    date: string;
    equity: number;
    drawdown: number;
  }>;
}

interface AnalysisResponse {
  signalLocked?: boolean;
  signalCandleTime?: string;
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
  trend: 'Bullish' | 'Bearish' | 'Sideways';
  reason: string[];
  warnings: string[];
  ensemble?: {
    score: number;
    confidence: number;
    consensus: number;
    regime: {
      state: string;
      trendStrength: number;
      volatilityPct: number;
      volumeRatio: number;
    };
    votes: Array<{
      name: string;
      score: number;
      weight: number;
      confidence: number;
      signal: Signal;
      reason: string;
    }>;
  };
  risk?: {
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
  };
  backtest: BacktestMetrics;
}

interface SnapshotResponse {
  symbol: string;
  normalizedSymbol: string;
  marketType: string;
  interval: string;
  range: string;
  history: any[];
  quote: any;
  analysis: AnalysisResponse;
}

interface IntelHeadline {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  query: string;
}

interface CalendarEvent {
  event: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
  currency?: string;
  link?: string;
  isUpcoming?: boolean;
}

interface IntelNarrative {
  bias: 'bullish' | 'bearish' | 'neutral';
  warningLevel: 'high' | 'medium' | 'low';
  strength: number;
  summary: string;
  factors: string[];
  sentimentScore: number;
  upcomingHighImpact: number;
  recentHighImpact: number;
}

interface MarketIntelResponse {
  symbol: string;
  marketType: string;
  headlines: IntelHeadline[];
  calendar: CalendarEvent[];
  narrative?: IntelNarrative;
  warnings?: string[];
  freshnessHours?: number;
  updatedAt: string;
}

interface GeopoliticalEvent {
  title: string;
  region: string;
  riskLevel: 'high' | 'medium' | 'low';
  publishedAt: string;
  source: string;
  link: string;
}

interface InstitutionalRow {
  organization: string;
  source: 'institutionOwnership' | 'fundOwnership';
  side: 'BUY' | 'SELL' | 'HOLD';
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
  dominantSide: 'BUY' | 'SELL' | 'NEUTRAL';
  dominanceScore: number;
  topBuyer: string | null;
  topSeller: string | null;
}

interface InstitutionalResponse {
  symbol: string;
  marketType: string;
  supported: boolean;
  note?: string;
  updatedAt: string;
  insiderNetShares: number | null;
  insiderBuyShares: number | null;
  insiderSellShares: number | null;
  summary: InstitutionalSummary;
  rows: InstitutionalRow[];
}

const TIMEFRAMES = [
  { label: 'Scalp 5m', value: '5m', interval: '5m', range: '5d' },
  { label: 'Day 15m', value: '15m', interval: '15m', range: '1mo' },
  { label: 'Swing 1H', value: '1h', interval: '1h', range: '3mo' },
  { label: 'Swing 1D', value: '1d', interval: '1d', range: '1y' },
  { label: 'Pos 1W', value: '1w', interval: '1wk', range: '5y' },
  { label: 'Hold 1M', value: '1mo', interval: '1mo', range: 'max' },
];

type ChartMode = 'native' | 'tradingview';
type VisualMode = 'matrix' | 'inferno' | 'arctic';

const VISUAL_MODE_CONFIG: Record<
  VisualMode,
  {
    label: string;
    haloClass: string;
    titleGradient: string;
    activeTimeframeClass: string;
    activeTvClass: string;
    activeNativeClass: string;
    liveBadgeClass: string;
  }
> = {
  matrix: {
    label: 'Matrix',
    haloClass: 'bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.25),transparent_42%),radial-gradient(circle_at_88%_4%,rgba(56,189,248,0.22),transparent_35%)]',
    titleGradient: 'from-emerald-300 via-lime-300 to-cyan-300',
    activeTimeframeClass: 'bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    activeTvClass: 'bg-cyan-400 text-zinc-950',
    activeNativeClass: 'bg-emerald-400 text-zinc-950',
    liveBadgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  inferno: {
    label: 'Inferno',
    haloClass: 'bg-[radial-gradient(circle_at_15%_10%,rgba(245,158,11,0.26),transparent_42%),radial-gradient(circle_at_90%_6%,rgba(244,63,94,0.22),transparent_35%)]',
    titleGradient: 'from-amber-300 via-orange-300 to-rose-300',
    activeTimeframeClass: 'bg-amber-400 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.32)]',
    activeTvClass: 'bg-rose-400 text-zinc-950',
    activeNativeClass: 'bg-amber-400 text-zinc-950',
    liveBadgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  },
  arctic: {
    label: 'Arctic',
    haloClass: 'bg-[radial-gradient(circle_at_12%_8%,rgba(59,130,246,0.24),transparent_42%),radial-gradient(circle_at_86%_8%,rgba(20,184,166,0.2),transparent_35%)]',
    titleGradient: 'from-sky-300 via-cyan-300 to-teal-300',
    activeTimeframeClass: 'bg-sky-400 text-zinc-950 shadow-[0_0_20px_rgba(56,189,248,0.34)]',
    activeTvClass: 'bg-teal-300 text-zinc-950',
    activeNativeClass: 'bg-sky-400 text-zinc-950',
    liveBadgeClass: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
  },
};

function toTradingViewSymbol(symbol: string, marketType: string): string {
  const raw = (symbol || '').toUpperCase().trim().replace(/\s+/g, '');
  if (!raw) return 'NASDAQ:AAPL';

  if (marketType === 'forex') {
    const pair = raw.replace('/', '').replace('=X', '');
    if (/^[A-Z]{6}$/.test(pair)) return `OANDA:${pair}`;
  }

  if (marketType === 'crypto') {
    if (raw.includes('/')) {
      const [base, quote] = raw.split('/');
      if (base && quote) {
        const normalizedQuote = quote === 'USD' ? 'USDT' : quote;
        return `BINANCE:${base}${normalizedQuote}`;
      }
    }
    if (raw.endsWith('-USD') || raw.endsWith('-USDT')) {
      const [base, quote] = raw.split('-');
      if (base) return `BINANCE:${base}${quote === 'USD' ? 'USDT' : quote}`;
    }
    if (/^[A-Z0-9]{2,12}USDT$/.test(raw)) return `BINANCE:${raw}`;
  }

  if (raw.endsWith('.JK')) {
    return `IDX:${raw.replace('.JK', '')}`;
  }

  return `NASDAQ:${raw}`;
}

const DEFAULT_STUDIES = 'MACD@tv-basicstudies,RSI@tv-basicstudies,BB@tv-basicstudies,EMA@tv-basicstudies';
const DEFAULT_PINE_LIKE_SCRIPT = `//@version=5
indicator("Omni Hybrid", overlay=true)
fast = ta.ema(close, 21)
slow = ta.ema(close, 55)
r = ta.rsi(close, 14)
plot(fast, color=color.new(color.green, 0))
plot(slow, color=color.new(color.red, 0))
plot(r)`;

interface PineConversionResult {
  studies: string[];
  supported: string[];
  unsupported: string[];
}

function convertPineLikeScript(script: string): PineConversionResult {
  const content = script.toLowerCase();
  const mappings: Array<{ token: string; study: string; name: string }> = [
    { token: 'ta.ema(', study: 'EMA@tv-basicstudies', name: 'EMA' },
    { token: 'ta.sma(', study: 'MASimple@tv-basicstudies', name: 'SMA' },
    { token: 'ta.rsi(', study: 'RSI@tv-basicstudies', name: 'RSI' },
    { token: 'ta.macd(', study: 'MACD@tv-basicstudies', name: 'MACD' },
    { token: 'ta.bb(', study: 'BB@tv-basicstudies', name: 'Bollinger Bands' },
    { token: 'ta.stoch(', study: 'Stochastic@tv-basicstudies', name: 'Stochastic' },
    { token: 'ta.atr(', study: 'ATR@tv-basicstudies', name: 'ATR' },
    { token: 'ta.vwma(', study: 'VWMA@tv-basicstudies', name: 'VWMA' },
  ];

  const supported: string[] = [];
  const studies = new Set<string>();
  for (const mapping of mappings) {
    if (content.includes(mapping.token)) {
      supported.push(mapping.name);
      studies.add(mapping.study);
    }
  }

  const unsupportedTokens = [
    'strategy.entry(',
    'strategy.exit(',
    'strategy.order(',
    'request.security(',
    'alertcondition(',
    'table.',
    'line.new(',
    'label.new(',
    'plotshape(',
  ];
  const unsupported = unsupportedTokens.filter((token) => content.includes(token));

  return {
    studies: Array.from(studies),
    supported,
    unsupported,
  };
}

export default function Dashboard() {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [resolvedSymbol, setResolvedSymbol] = useState('AAPL');
  const [marketType, setMarketType] = useState('stock');
  const [chartMode, setChartMode] = useState<ChartMode>('tradingview');
  const [visualMode, setVisualMode] = useState<VisualMode>('matrix');
  const [tvTheme, setTvTheme] = useState<'dark' | 'light'>('dark');
  const [tvSymbolOverride, setTvSymbolOverride] = useState('');
  const [tvStudiesInput, setTvStudiesInput] = useState(DEFAULT_STUDIES);
  const [showPinePanel, setShowPinePanel] = useState(false);
  const [tvExpanded, setTvExpanded] = useState(false);
  const [pineScriptInput, setPineScriptInput] = useState(DEFAULT_PINE_LIKE_SCRIPT);
  const [pineConversion, setPineConversion] = useState<PineConversionResult>(() =>
    convertPineLikeScript(DEFAULT_PINE_LIKE_SCRIPT),
  );
  const [timeframe, setTimeframe] = useState<TimeframeConfig>(TIMEFRAMES[2]);
  const [data, setData] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [intel, setIntel] = useState<MarketIntelResponse | null>(null);
  const [institutional, setInstitutional] = useState<InstitutionalResponse | null>(null);
  const [geoEvents, setGeoEvents] = useState<GeopoliticalEvent[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [institutionalLoading, setInstitutionalLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoUpdatedAt, setGeoUpdatedAt] = useState<string | null>(null);
  const [headlineCursor, setHeadlineCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stock/${encodeURIComponent(symbol)}/snapshot?interval=${timeframe.interval}&range=${timeframe.range}`
      );
      if (!response.ok) {
        let message = `Failed to fetch market data (${response.status})`;
        try {
          const errorBody = await response.json();
          if (typeof errorBody?.error === 'string') {
            message = errorBody.error;
          }
        } catch {
          // Ignore json parse failures for non-json responses.
        }
        throw new Error(message);
      }

      const snapshot: SnapshotResponse = await response.json();
      setResolvedSymbol(snapshot.symbol || symbol.toUpperCase());
      setMarketType(snapshot.marketType || 'stock');
      setData(Array.isArray(snapshot.history) ? snapshot.history : []);
      setQuote(snapshot.quote ?? null);
      setAnalysis(snapshot.analysis ?? null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : 'Unknown error while loading market data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchIntel = async () => {
    setIntelLoading(true);
    try {
      const response = await fetch(`/api/intel/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error(`Intel request failed (${response.status})`);
      const payload: MarketIntelResponse = await response.json();
      setIntel(payload);
      setHeadlineCursor(0);
    } catch (intelError) {
      console.error('Intel fetch error:', intelError);
    } finally {
      setIntelLoading(false);
    }
  };

  const fetchInstitutional = async () => {
    setInstitutionalLoading(true);
    try {
      const response = await fetch(`/api/institutional/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error(`Institutional request failed (${response.status})`);
      const payload: InstitutionalResponse = await response.json();
      setInstitutional(payload);
    } catch (institutionalError) {
      console.error('Institutional fetch error:', institutionalError);
    } finally {
      setInstitutionalLoading(false);
    }
  };

  const fetchGeopolitics = async () => {
    setGeoLoading(true);
    try {
      const response = await fetch('/api/geopolitics');
      if (!response.ok) throw new Error(`Geopolitics request failed (${response.status})`);
      const payload = await response.json();
      setGeoEvents(Array.isArray(payload?.events) ? payload.events : []);
      setGeoUpdatedAt(typeof payload?.updatedAt === 'string' ? payload.updatedAt : null);
    } catch (geoError) {
      console.error('Geopolitics fetch error:', geoError);
    } finally {
      setGeoLoading(false);
    }
  };

  const applyPineStudies = () => {
    const parsed = convertPineLikeScript(pineScriptInput);
    setPineConversion(parsed);
    if (!parsed.studies.length) return;

    const merged = new Set(
      tvStudiesInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );
    parsed.studies.forEach((study) => merged.add(study));
    setTvStudiesInput(Array.from(merged).join(','));
  };

  useEffect(() => {
    fetchData(true);
    fetchIntel();

    const intervalId = setInterval(() => {
      fetchData(false);
      fetchIntel();
    }, 20000);

    return () => clearInterval(intervalId);
  }, [symbol, timeframe.value]);

  useEffect(() => {
    fetchInstitutional();
    const intervalId = setInterval(() => {
      fetchInstitutional();
    }, 60_000);
    return () => clearInterval(intervalId);
  }, [symbol]);

  useEffect(() => {
    fetchGeopolitics();
    const intervalId = setInterval(() => {
      fetchGeopolitics();
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!intel?.headlines?.length || intel.headlines.length < 2) return;
    const intervalId = setInterval(() => {
      setHeadlineCursor((prev) => (prev + 1) % intel.headlines.length);
    }, 4500);
    return () => clearInterval(intervalId);
  }, [intel?.headlines]);

  useEffect(() => {
    if (chartMode !== 'tradingview' && tvExpanded) {
      setTvExpanded(false);
    }
  }, [chartMode, tvExpanded]);

  useEffect(() => {
    if (!tvExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTvExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tvExpanded]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
    }
  };

  const signal: Signal = analysis?.signal ?? 'HOLD';
  const currentPrice = quote?.regularMarketPrice ?? analysis?.entry;
  const marketChange = typeof quote?.regularMarketChange === 'number' ? quote.regularMarketChange : null;
  const marketChangePercent = typeof quote?.regularMarketChangePercent === 'number' ? quote.regularMarketChangePercent : null;
  const isPositive = typeof quote?.regularMarketChange === 'number'
    ? quote.regularMarketChange >= 0
    : data.length > 1
      ? data[data.length - 1].close >= data[data.length - 2].close
      : true;

  const formatMetric = (value: number | null | undefined, digits = 2) => {
    return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '--';
  };

  const autoTvSymbol = toTradingViewSymbol(resolvedSymbol || symbol, marketType);
  const tradingViewSymbol = tvSymbolOverride.trim() ? tvSymbolOverride.trim().toUpperCase() : autoTvSymbol;
  const tradingViewStudiesCsv = useMemo(
    () =>
      tvStudiesInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .join(','),
    [tvStudiesInput],
  );

  const tickerHeadlines = useMemo(() => {
    const headlines = intel?.headlines ?? [];
    if (!headlines.length) return [];
    return Array.from({ length: Math.min(6, headlines.length) }, (_item, index) => {
      const pointer = (headlineCursor + index) % headlines.length;
      return headlines[pointer];
    });
  }, [intel?.headlines, headlineCursor]);

  const geoSummary = useMemo(() => {
    const count = { high: 0, medium: 0, low: 0 };
    const byRegion = new Map<string, number>();
    for (const event of geoEvents) {
      count[event.riskLevel] += 1;
      byRegion.set(event.region, (byRegion.get(event.region) ?? 0) + 1);
    }
    const topRegions = Array.from(byRegion.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return { count, topRegions };
  }, [geoEvents]);

  const professionalComposite = useMemo(() => {
    const modelConfidence = analysis?.confidence ?? 50;
    const institutionalBias =
      institutional?.supported && institutional.summary
        ? institutional.summary.dominantSide === 'BUY'
          ? institutional.summary.dominanceScore
          : institutional.summary.dominantSide === 'SELL'
            ? -institutional.summary.dominanceScore
            : 0
        : 0;
    const newsBias = intel?.narrative
      ? intel.narrative.bias === 'bullish'
        ? intel.narrative.strength
        : intel.narrative.bias === 'bearish'
          ? -intel.narrative.strength
          : 0
      : 0;
    const warningPenalty =
      intel?.narrative?.warningLevel === 'high'
        ? 18
        : intel?.narrative?.warningLevel === 'medium'
          ? 8
          : 0;

    const raw = modelConfidence * 0.6 + institutionalBias * 0.2 + newsBias * 0.2 - warningPenalty;
    const score = Math.max(0, Math.min(100, raw));
    const direction = score >= 60 ? 'BULLISH' : score <= 40 ? 'BEARISH' : 'NEUTRAL';
    return { score, direction };
  }, [analysis?.confidence, institutional, intel?.narrative]);

  const visual = VISUAL_MODE_CONFIG[visualMode];
  const cycleVisualMode = () => {
    const modes: VisualMode[] = ['matrix', 'inferno', 'arctic'];
    const index = modes.indexOf(visualMode);
    setVisualMode(modes[(index + 1) % modes.length]);
  };

  const precisionRows = useMemo(() => {
    if (!analysis) return [];
    const entry = analysis.entry;
    const levels = [
      { label: 'Stop Loss', value: analysis.stopLoss, type: 'risk' as const },
      { label: 'Entry', value: entry, type: 'entry' as const },
      { label: 'Take Profit 1', value: analysis.takeProfit1, type: 'target' as const },
      { label: 'Take Profit 2', value: analysis.takeProfit2, type: 'target' as const },
    ];
    const tickSize = Math.max(Math.abs(entry) * 0.0001, 0.0001);
    const price = typeof currentPrice === 'number' ? currentPrice : entry;
    return levels.map((level) => {
      const delta = price - level.value;
      return {
        ...level,
        delta,
        ticks: tickSize > 0 ? delta / tickSize : 0,
      };
    });
  }, [analysis, currentPrice]);

  const signalArrow = signal === 'BUY' ? <ArrowUpRight className="w-4 h-4" /> : signal === 'SELL' ? <ArrowDownRight className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />;

  return (
    <div className={`relative max-w-[1700px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 ${visual.haloClass}`}>
      <div className="lg:col-span-3 space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 data-text="Architect-19 Trade Ai" className={`hacker-title text-3xl font-bold tracking-tight bg-gradient-to-r ${visual.titleGradient} bg-clip-text text-transparent flex items-center gap-2`}>
              <Activity className="text-emerald-500" />
              Architect-19 Trade Ai
              <span className={`ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-widest uppercase ${visual.liveBadgeClass}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                Live
              </span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Institutional-style market model for stocks, forex, and crypto</p>
          </div>

          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <button
              onClick={cycleVisualMode}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold uppercase tracking-wide hover:border-zinc-500 transition"
            >
              <Palette className="w-3.5 h-3.5" />
              Mode {visual.label}
            </button>

            <form onSubmit={handleSearch} className="relative w-full md:w-64">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="AAPL, EURUSD, BTC-USD"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            </form>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-600/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{quote?.shortName || resolvedSymbol}</h2>
              <p className="text-zinc-400 text-sm flex items-center gap-2">
                <span>{quote?.exchange || resolvedSymbol}</span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs uppercase">{marketType}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-white">
                {typeof currentPrice === 'number' ? `$${currentPrice.toFixed(4)}` : '---'}
              </div>
              {marketChange !== null ? (
                <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{marketChange.toFixed(4)} ({marketChangePercent !== null ? marketChangePercent.toFixed(2) : '--'}%)</span>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 mt-1">Live quote unavailable</div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  timeframe.value === tf.value
                    ? visual.activeTimeframeClass
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setChartMode('tradingview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition ${
                chartMode === 'tradingview'
                  ? visual.activeTvClass
                  : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              TradingView Mode
            </button>
            <button
              onClick={() => setChartMode('native')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition ${
                chartMode === 'native'
                  ? visual.activeNativeClass
                  : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Native Mode
            </button>
            {chartMode === 'tradingview' && (
              <button
                onClick={() => setShowPinePanel((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-cyan-400/60 transition"
              >
                <Code2 className="w-3.5 h-3.5" />
                Pine
              </button>
            )}
            {chartMode === 'tradingview' && (
              <button
                onClick={() => setTvTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 transition"
              >
                Theme: {tvTheme}
              </button>
            )}
            {chartMode === 'tradingview' && (
              <button
                onClick={() => setTvExpanded(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Expand Chart
              </button>
            )}
          </div>

          {chartMode === 'tradingview' && (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-zinc-400">
                TradingView Symbol (opsional, override)
                <input
                  type="text"
                  value={tvSymbolOverride}
                  onChange={(e) => setTvSymbolOverride(e.target.value)}
                  placeholder={autoTvSymbol}
                  className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </label>
              <label className="text-xs text-zinc-400">
                Indicator Pribadi (pisah koma)
                <input
                  type="text"
                  value={tvStudiesInput}
                  onChange={(e) => setTvStudiesInput(e.target.value)}
                  placeholder="MACD@tv-basicstudies,RSI@tv-basicstudies"
                  className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </label>
              {showPinePanel && (
                <div className="md:col-span-2 rounded-xl border border-cyan-500/20 bg-zinc-900 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-300 inline-flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-300" />
                      Pine Workspace (hacker mode)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={applyPineStudies}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition"
                      >
                        Parse + Apply
                      </button>
                      <button
                        onClick={() => setShowPinePanel(false)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={pineScriptInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPineScriptInput(value);
                      setPineConversion(convertPineLikeScript(value));
                    }}
                    rows={8}
                    spellCheck={false}
                    className="mt-2 w-full resize-y bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-mono text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                      <div className="text-emerald-300 uppercase mb-1">Supported Parsed</div>
                      <div className="text-zinc-200">
                        {pineConversion.supported.length ? pineConversion.supported.join(', ') : 'No supported indicators detected.'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                      <div className="text-amber-300 uppercase mb-1">Not Supported In Widget</div>
                      <div className="text-zinc-200">
                        {pineConversion.unsupported.length ? pineConversion.unsupported.join(', ') : 'None'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-500">
                    Pine full engine belum tersedia di widget publik. Parser ini map fungsi populer ke indikator TradingView.
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`w-full relative ${chartMode === 'tradingview' ? 'h-[680px]' : 'h-[460px]'}`}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              chartMode === 'tradingview' ? (
                <TradingViewPanel
                  symbol={tradingViewSymbol}
                  interval={timeframe.interval}
                  studiesCsv={tradingViewStudiesCsv}
                  theme={tvTheme}
                />
              ) : (
                <Chart data={data} />
              )
            )}
          </div>

          {analysis && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-xs uppercase tracking-wider text-zinc-400 inline-flex items-center gap-1.5">
                  {signalArrow}
                  Precision Entry Ladder
                </div>
                <div className="text-[11px] text-zinc-500">
                  Live Price {formatMetric(currentPrice, 4)} | Tick Map
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
                <div className={`rounded-lg border p-2 ${
                  signal === 'BUY' ? 'border-emerald-500/30 bg-emerald-500/10' : signal === 'SELL' ? 'border-rose-500/30 bg-rose-500/10' : 'border-zinc-700 bg-zinc-950'
                }`}>
                  <div className="text-zinc-400 uppercase">Direction</div>
                  <div className="text-zinc-100 font-semibold inline-flex items-center gap-1">
                    {signalArrow}
                    {signal}
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
                  <div className="text-zinc-400 uppercase">Entry</div>
                  <div className="text-zinc-100 font-mono">{formatMetric(analysis.entry, 4)}</div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
                  <div className="text-emerald-300 uppercase">TP1</div>
                  <div className="text-zinc-100 font-mono">{formatMetric(analysis.takeProfit1, 4)}</div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
                  <div className="text-emerald-300 uppercase">TP2</div>
                  <div className="text-zinc-100 font-mono">{formatMetric(analysis.takeProfit2, 4)}</div>
                </div>
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2">
                  <div className="text-rose-300 uppercase">SL</div>
                  <div className="text-zinc-100 font-mono">{formatMetric(analysis.stopLoss, 4)}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="text-left py-2 pr-2">Level</th>
                      <th className="text-right py-2 pr-2">Price</th>
                      <th className="text-right py-2 pr-2">Delta</th>
                      <th className="text-right py-2">Ticks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {precisionRows.map((row) => (
                      <tr key={row.label} className="border-b border-zinc-900">
                        <td className={`py-2 pr-2 ${
                          row.type === 'risk' ? 'text-rose-300' : row.type === 'target' ? 'text-emerald-300' : 'text-cyan-300'
                        }`}>
                          {row.label}
                        </td>
                        <td className="py-2 pr-2 text-right text-zinc-100 font-mono">{formatMetric(row.value, 4)}</td>
                        <td className={`py-2 pr-2 text-right font-mono ${
                          row.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                        }`}>
                          {row.delta >= 0 ? '+' : ''}{formatMetric(row.delta, 4)}
                        </td>
                        <td className={`py-2 text-right font-mono ${
                          row.ticks >= 0 ? 'text-emerald-300' : 'text-rose-300'
                        }`}>
                          {row.ticks >= 0 ? '+' : ''}{formatMetric(row.ticks, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                Marker/arrow langsung di sumbu TradingView perlu Charting Library berlisensi. Panel ini memberi reference entry presisi real-time dari feed saat ini.
              </div>
            </div>
          )}
        </motion.div>

        {tvExpanded && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setTvExpanded(false)}
            />
            <div className="fixed inset-3 z-50 rounded-2xl border border-zinc-700 bg-zinc-950 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-zinc-400">
                  TradingView Expanded | {resolvedSymbol}
                </div>
                <button
                  onClick={() => setTvExpanded(false)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Close
                </button>
              </div>
              <div className="h-[calc(100vh-6.5rem)] w-full rounded-xl border border-zinc-800 overflow-hidden">
                {chartMode === 'tradingview' ? (
                  <TradingViewPanel
                    symbol={tradingViewSymbol}
                    interval={timeframe.interval}
                    studiesCsv={tradingViewStudiesCsv}
                    theme={tvTheme}
                  />
                ) : (
                  <Chart data={data} />
                )}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignalCard
            type="ENTRY"
            signal={signal}
            price={currentPrice}
            timeframe={timeframe.label}
            analysis={analysis}
          />
          <SignalCard
            type="TARGETS"
            signal={signal}
            price={currentPrice}
            timeframe={timeframe.label}
            analysis={analysis}
          />
        </div>

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                Model Diagnostics
              </h3>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-300">
                Trend {analysis.trend}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-zinc-500">Confidence</div>
                <div className="text-white font-mono">{formatMetric(analysis.confidence, 0)}%</div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-zinc-500">Win Rate</div>
                <div className="text-white font-mono">{formatMetric(analysis.backtest.winRate)}%</div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-zinc-500">Max DD</div>
                <div className="text-white font-mono">{formatMetric(analysis.backtest.maxDrawdown)}%</div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-zinc-500">Sharpe</div>
                <div className="text-white font-mono">{formatMetric(analysis.backtest.sharpe, 3)}</div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-zinc-500">Profit Factor</div>
                <div className="text-white font-mono">{formatMetric(analysis.backtest.profitFactor, 3)}</div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-zinc-500">R:R (TP2)</div>
                <div className="text-white font-mono">{formatMetric(analysis.riskReward, 2)}</div>
              </div>
            </div>

            {analysis.ensemble && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                  <div className="text-zinc-500">Ensemble Score</div>
                  <div className="text-zinc-200 font-mono">{formatMetric(analysis.ensemble.score, 3)}</div>
                </div>
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                  <div className="text-zinc-500">Consensus</div>
                  <div className="text-zinc-200 font-mono">{formatMetric((analysis.ensemble.consensus ?? 0) * 100, 1)}%</div>
                </div>
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                  <div className="text-zinc-500">Regime</div>
                  <div className="text-zinc-200 font-mono uppercase">{analysis.ensemble.regime.state}</div>
                </div>
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                  <div className="text-zinc-500">Volatility</div>
                  <div className="text-zinc-200 font-mono">{formatMetric(analysis.ensemble.regime.volatilityPct, 2)}%</div>
                </div>
              </div>
            )}

            <div className="mt-3 text-xs text-zinc-400">
              Signal mode: {analysis.signalLocked ? 'Locked on closed candle (non-repaint)' : 'Live candle'}.
              {analysis.signalCandleTime ? ` Source: ${new Date(analysis.signalCandleTime).toLocaleString()}` : ''}
            </div>

            <div className="mt-4 space-y-1 text-sm text-zinc-300">
              {analysis.reason.slice(0, 5).map((item, index) => (
                <p key={`${item}-${index}`}>- {item}</p>
              ))}
            </div>

            {analysis.warnings.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-xs space-y-1">
                {analysis.warnings.slice(0, 4).map((warning, index) => (
                  <p key={`${warning}-${index}`}>- {warning}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <PerformancePanel
          backtest={analysis?.backtest}
          risk={analysis?.risk}
          institutional={institutional}
          institutionalLoading={institutionalLoading}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">Geo Conflict Monitor</h3>
            <span className="text-xs text-zinc-500">
              {geoUpdatedAt ? `Updated ${new Date(geoUpdatedAt).toLocaleTimeString()}` : 'Live feed'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
              <div className="text-[11px] uppercase text-rose-300">High Risk</div>
              <div className="text-2xl font-mono text-white">{geoSummary.count.high}</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="text-[11px] uppercase text-amber-300">Medium Risk</div>
              <div className="text-2xl font-mono text-white">{geoSummary.count.medium}</div>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="text-[11px] uppercase text-emerald-300">Low Risk</div>
              <div className="text-2xl font-mono text-white">{geoSummary.count.low}</div>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3">
              <div className="text-[11px] uppercase text-zinc-400">Top Region</div>
              <div className="text-sm text-zinc-100 mt-1 uppercase">
                {geoSummary.topRegions[0]?.[0] ?? 'n/a'}
              </div>
              <div className="text-[11px] text-zinc-500">{geoSummary.topRegions[0]?.[1] ?? 0} events</div>
            </div>
          </div>

          {geoLoading && geoEvents.length === 0 ? (
            <div className="text-sm text-zinc-500">Loading geopolitical updates...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 pr-3">Time</th>
                    <th className="text-left py-2 pr-3">Region</th>
                    <th className="text-left py-2 pr-3">Risk</th>
                    <th className="text-left py-2 pr-3">Source</th>
                    <th className="text-left py-2">Headline</th>
                  </tr>
                </thead>
                <tbody>
                  {geoEvents.slice(0, 14).map((event, index) => (
                    <tr key={`${event.link}-${index}`} className="border-b border-zinc-900/70">
                      <td className="py-2 pr-3 text-zinc-400 whitespace-nowrap">{new Date(event.publishedAt).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-zinc-300 uppercase">{event.region}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          event.riskLevel === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : event.riskLevel === 'medium'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {event.riskLevel}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-400">{event.source}</td>
                      <td className="py-2 text-zinc-200">
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-300 transition-colors"
                        >
                          {event.title}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <div className="lg:col-span-1 space-y-4">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400">Fundamental & News</h3>
            <div className="text-right">
              <span className="block text-[11px] text-zinc-500">
                {intel?.updatedAt ? `Updated ${new Date(intel.updatedAt).toLocaleTimeString()}` : 'Loading...'}
              </span>
              <span className="block text-[10px] text-zinc-600">
                Fresh window: {intel?.freshnessHours ?? 48}h
              </span>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="text-xs text-zinc-500 mb-1">Pair Active</div>
            <div className="text-white font-semibold">{resolvedSymbol}</div>
            <div className="text-xs text-zinc-400 uppercase">{marketType}</div>
          </div>

          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="text-xs text-zinc-500 mb-1">Prediction Snapshot</div>
            <div className="text-sm text-white">
              Signal <span className="font-bold">{signal}</span> | Confidence {formatMetric(analysis?.confidence, 0)}%
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Entry {formatMetric(analysis?.entry, 4)} | TP1 {formatMetric(analysis?.takeProfit1, 4)} | SL {formatMetric(analysis?.stopLoss, 4)}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2">
                <div className="text-cyan-300 uppercase">Composite Score</div>
                <div className="text-zinc-100 font-mono">{formatMetric(professionalComposite.score, 1)} / 100</div>
              </div>
              <div className="rounded-md border border-zinc-700 bg-zinc-950 p-2">
                <div className="text-zinc-400 uppercase">Composite Bias</div>
                <div className="text-zinc-100 font-mono">{professionalComposite.direction}</div>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">News Reaction Model</div>
              <span className={`text-[10px] font-bold uppercase ${
                intel?.narrative?.warningLevel === 'high'
                  ? 'text-rose-400'
                  : intel?.narrative?.warningLevel === 'medium'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}>
                {intel?.narrative?.warningLevel ?? 'low'} warning
              </span>
            </div>
            <div className="mt-1 text-sm text-white">
              Bias <span className="font-semibold uppercase">{intel?.narrative?.bias ?? 'neutral'}</span> | Strength{' '}
              <span className="font-mono">{formatMetric(intel?.narrative?.strength, 1)}%</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {intel?.narrative?.summary ?? 'Waiting for fresh fundamental context...'}
            </div>
            {(intel?.warnings?.length ?? 0) > 0 && (
              <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200 space-y-1">
                {intel?.warnings?.slice(0, 3).map((warning, index) => (
                  <p key={`${warning}-${index}`}>- {warning}</p>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="text-xs text-zinc-500 mb-2">News Schedule / Economic Triggers</div>
            <div className="space-y-2">
              {(intel?.calendar ?? []).slice(0, 6).map((event, index) => (
                <div key={`${event.event}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-200 text-xs">{event.event}</span>
                    <span className={`text-[10px] uppercase font-bold ${
                      event.impact === 'high'
                        ? 'text-rose-400'
                        : event.impact === 'medium'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}>
                      {event.impact}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 gap-2">
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                    <span className="uppercase">
                      {event.currency ?? 'global'} | {event.isUpcoming ? 'upcoming' : 'released'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-600">
                    <span>{event.source}</span>
                    {event.link ? (
                      <a href={event.link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300">
                        source
                      </a>
                    ) : (
                      <span>feed</span>
                    )}
                  </div>
                </div>
              ))}
              {!intelLoading && (!intel || intel.calendar.length === 0) && (
                <div className="text-xs text-zinc-500">No scheduled catalyst detected for this pair yet.</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 mb-2">Live Fundamental Ticker (Top to Bottom)</div>
            <div className="h-[280px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-2">
              <motion.div
                key={`${resolvedSymbol}-${headlineCursor}`}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-2"
              >
                {tickerHeadlines.map((headline, index) => (
                  <a
                    key={`${headline.link}-${index}`}
                    href={headline.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-zinc-800 bg-zinc-950 p-2 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="text-xs text-zinc-200 leading-snug">{headline.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{headline.source}</span>
                      <span>{new Date(headline.publishedAt).toLocaleString()}</span>
                    </div>
                  </a>
                ))}
              </motion.div>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              Ticker auto-scroll tiap ~4.5 detik, sinkron dengan pair aktif.
            </div>
            <div className="mt-2 space-y-2">
              {(intel?.headlines ?? []).slice(0, 3).map((headline, index) => (
                <a
                  key={`pin-${headline.link}-${index}`}
                  href={headline.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="text-xs text-zinc-100 leading-snug">{headline.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{headline.source}</span>
                    <span>{new Date(headline.publishedAt).toLocaleTimeString()}</span>
                  </div>
                </a>
              ))}
              {!intelLoading && (intel?.headlines?.length ?? 0) === 0 && (
                <div className="text-xs text-zinc-500">No fresh headline in last 48 hours for this pair.</div>
              )}
              {intelLoading && (
                <div className="text-xs text-zinc-500">Loading symbol-specific fundamental news...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FloatingChat
        symbol={resolvedSymbol}
        quote={quote}
        signal={signal}
        timeframe={timeframe.label}
        analysis={analysis}
      />
    </div>
  );
}
