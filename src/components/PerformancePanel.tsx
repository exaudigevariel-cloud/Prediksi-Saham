import React from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

interface BacktestFold {
  fold: number;
  trades: number;
  winRate: number | null;
  netProfitPct: number;
  maxDrawdown: number | null;
  pass: boolean;
}

interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

interface BacktestMetrics {
  trades: number;
  winRate?: number | null;
  maxDrawdown?: number | null;
  netProfitPct?: number | null;
  profitFactor?: number | null;
  sharpe?: number | null;
  sortino?: number | null;
  calmar?: number | null;
  cagr?: number | null;
  walkForwardPassRate?: number | null;
  walkForwardFolds?: number;
  feesPaidPct?: number | null;
  slippagePaidPct?: number | null;
  spreadPaidPct?: number | null;
  folds?: BacktestFold[];
  equityCurve?: EquityPoint[];
}

interface RiskPlan {
  killSwitch: boolean;
  allowedTrade: boolean;
  riskPerTradePct: number;
  suggestedPositionPct: number;
  maxPortfolioRiskPct: number;
  dailyLossLimitPct: number;
  maxOpenPositions: number;
  notes: string[];
}

interface PerformancePanelProps {
  backtest?: BacktestMetrics | null;
  risk?: RiskPlan | null;
}

function fmt(value: number | null | undefined, digits = 2) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '--';
}

export default function PerformancePanel({ backtest, risk }: PerformancePanelProps) {
  if (!backtest) return null;

  const curveData = (backtest.equityCurve ?? []).map((point) => ({
    ...point,
    label: format(new Date(point.date), 'MMM dd'),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Institutional Evaluation
        </h3>
        <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-300">
          Folds {backtest.walkForwardFolds || 0}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
          <div className="text-zinc-500">Net PnL</div>
          <div className="text-white font-mono">{fmt(backtest.netProfitPct)}%</div>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
          <div className="text-zinc-500">Sharpe</div>
          <div className="text-white font-mono">{fmt(backtest.sharpe, 3)}</div>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
          <div className="text-zinc-500">Sortino</div>
          <div className="text-white font-mono">{fmt(backtest.sortino, 3)}</div>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
          <div className="text-zinc-500">Profit Factor</div>
          <div className="text-white font-mono">{fmt(backtest.profitFactor, 3)}</div>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
          <div className="text-zinc-500">WF Pass</div>
          <div className="text-white font-mono">{fmt(backtest.walkForwardPassRate)}%</div>
        </div>
      </div>

      <div className="h-[220px] w-full bg-zinc-900 rounded-xl border border-zinc-800 p-2">
        {curveData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} minTickGap={30} />
              <YAxis stroke="#71717a" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: number) => [value.toFixed(2), 'Equity']}
              />
              <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            Not enough backtest points for equity curve.
          </div>
        )}
      </div>

      {risk && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
            <div className="text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Risk / Trade
            </div>
            <div className="text-white font-mono">{fmt(risk.riskPerTradePct)}%</div>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
            <div className="text-zinc-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Position
            </div>
            <div className="text-white font-mono">{fmt(risk.suggestedPositionPct)}%</div>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
            <div className="text-zinc-500">Daily Loss Cap</div>
            <div className="text-white font-mono">{fmt(risk.dailyLossLimitPct)}%</div>
          </div>
          <div className={`rounded-lg border p-3 ${risk.killSwitch ? 'border-rose-500/50 bg-rose-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
            <div className="text-zinc-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Kill Switch
            </div>
            <div className={`font-mono ${risk.killSwitch ? 'text-rose-300' : 'text-emerald-300'}`}>
              {risk.killSwitch ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      )}

      {(backtest.folds?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Walk-Forward Folds</div>
          <div className="grid gap-2">
            {(backtest.folds ?? []).slice(-5).map((fold) => (
              <div key={fold.fold} className="grid grid-cols-5 gap-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                <span className="text-zinc-400">Fold {fold.fold}</span>
                <span className="text-zinc-200">Trades {fold.trades}</span>
                <span className="text-zinc-200">WR {fmt(fold.winRate)}%</span>
                <span className="text-zinc-200">PnL {fmt(fold.netProfitPct)}%</span>
                <span className={fold.pass ? 'text-emerald-400' : 'text-rose-400'}>{fold.pass ? 'PASS' : 'FAIL'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {risk?.notes && risk.notes.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-xs space-y-1">
          {risk.notes.slice(0, 4).map((note, idx) => (
            <p key={`${note}-${idx}`}>- {note}</p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
