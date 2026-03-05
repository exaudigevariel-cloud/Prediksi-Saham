import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, TrendingUp, TrendingDown, Search, Zap } from 'lucide-react';
import Chart from './Chart';
import SignalCard from './SignalCard';
import Chatbot from './Chatbot';
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

const TIMEFRAMES = [
  { label: 'Scalp 5m', value: '5m', interval: '5m', range: '5d' },
  { label: 'Day 15m', value: '15m', interval: '15m', range: '1mo' },
  { label: 'Swing 1H', value: '1h', interval: '1h', range: '3mo' },
  { label: 'Swing 1D', value: '1d', interval: '1d', range: '1y' },
  { label: 'Pos 1W', value: '1w', interval: '1wk', range: '5y' },
  { label: 'Hold 1M', value: '1mo', interval: '1mo', range: 'max' },
];

export default function Dashboard() {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [resolvedSymbol, setResolvedSymbol] = useState('AAPL');
  const [marketType, setMarketType] = useState('stock');
  const [timeframe, setTimeframe] = useState<TimeframeConfig>(TIMEFRAMES[2]);
  const [data, setData] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
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

  useEffect(() => {
    fetchData(true);

    const intervalId = setInterval(() => {
      fetchData(false);
    }, 20000);

    return () => clearInterval(intervalId);
  }, [symbol, timeframe.value]);

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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="text-emerald-500" />
              Architect-19 Trade Ai
              <span className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Institutional-style market model for stocks, forex, and crypto</p>
          </div>

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
                    ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="h-[400px] w-full relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Chart data={data} />
            )}
          </div>
        </motion.div>

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

        <PerformancePanel backtest={analysis?.backtest} risk={analysis?.risk} />
      </div>

      <div className="lg:col-span-1 h-[800px] lg:h-auto">
        <Chatbot
          symbol={resolvedSymbol}
          quote={quote}
          signal={signal}
          timeframe={timeframe.label}
          analysis={analysis}
        />
      </div>
    </div>
  );
}
