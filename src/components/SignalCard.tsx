import React from 'react';
import { motion } from 'motion/react';
import { Target, Crosshair, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SignalAnalysis {
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  risk?: {
    riskPerTradePct: number;
    suggestedPositionPct: number;
  };
  backtest?: {
    trades: number;
    winRate: number | null;
    maxDrawdown: number | null;
  };
}

interface SignalCardProps {
  type: 'ENTRY' | 'TARGETS';
  signal: 'BUY' | 'SELL' | 'HOLD';
  price?: number;
  timeframe: string;
  analysis?: SignalAnalysis | null;
}

export default function SignalCard({ type, signal, price, timeframe, analysis }: SignalCardProps) {
  const referencePrice = typeof analysis?.entry === 'number' ? analysis.entry : price;
  if (!referencePrice) return null;

  const isBuy = signal === 'BUY';
  const isSell = signal === 'SELL';

  const colorClass = isBuy ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                   : isSell ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                   : 'text-zinc-400 bg-zinc-800/50 border-zinc-700/50';

  const icon = type === 'ENTRY' ? <Crosshair className="w-5 h-5" /> : <Target className="w-5 h-5" />;

  const fallbackRisk = referencePrice * 0.01;
  const fallbackTp1 = isBuy ? referencePrice + fallbackRisk * 1.5 : isSell ? referencePrice - fallbackRisk * 1.5 : referencePrice + fallbackRisk;
  const fallbackTp2 = isBuy ? referencePrice + fallbackRisk * 3 : isSell ? referencePrice - fallbackRisk * 3 : referencePrice + fallbackRisk * 2;
  const fallbackSl = isBuy ? referencePrice - fallbackRisk : isSell ? referencePrice + fallbackRisk : referencePrice - fallbackRisk;

  const tp1 = analysis?.takeProfit1 ?? fallbackTp1;
  const tp2 = analysis?.takeProfit2 ?? fallbackTp2;
  const sl = analysis?.stopLoss ?? fallbackSl;

  const confidence = typeof analysis?.confidence === 'number' ? `${analysis.confidence.toFixed(0)}%` : '--';
  const winRate = typeof analysis?.backtest?.winRate === 'number' ? `${analysis.backtest.winRate.toFixed(2)}%` : '--';
  const drawdown = typeof analysis?.backtest?.maxDrawdown === 'number' ? `${analysis.backtest.maxDrawdown.toFixed(2)}%` : '--';
  const trades = typeof analysis?.backtest?.trades === 'number' ? analysis.backtest.trades : 0;
  const riskPerTrade = typeof analysis?.risk?.riskPerTradePct === 'number' ? `${analysis.risk.riskPerTradePct.toFixed(2)}%` : '--';
  const positionSize = typeof analysis?.risk?.suggestedPositionPct === 'number' ? `${analysis.risk.suggestedPositionPct.toFixed(2)}%` : '--';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl p-6 border backdrop-blur-sm ${colorClass}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-sm">
          {icon}
          {type === 'ENTRY' ? 'Entry Signal' : 'Trade Targets'}
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded-md bg-black/20">
          {timeframe} {signal}
        </span>
      </div>

      {type === 'ENTRY' ? (
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">
              {signal}
            </span>
            <span className="text-sm opacity-70">@ {referencePrice.toFixed(4)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="opacity-70 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Confidence
              </div>
              <div className="font-mono font-medium">{confidence}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="opacity-70 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Drawdown
              </div>
              <div className="font-mono font-medium">{drawdown}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="opacity-70 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Winrate
              </div>
              <div className="font-mono font-medium">{winRate}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="opacity-70 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Trades
              </div>
              <div className="font-mono font-medium">{trades}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="opacity-70 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Risk/Trade
              </div>
              <div className="font-mono font-medium">{riskPerTrade}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="opacity-70 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Position
              </div>
              <div className="font-mono font-medium">{positionSize}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 rounded-lg bg-black/20">
            <span className="text-sm opacity-70">Take Profit 1</span>
            <span className="font-mono font-medium">${tp1.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-black/20">
            <span className="text-sm opacity-70">Take Profit 2</span>
            <span className="font-mono font-medium">${tp2.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-rose-500/20">
            <span className="text-sm opacity-70">Stop Loss</span>
            <span className="font-mono font-medium text-rose-400">${sl.toFixed(2)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
