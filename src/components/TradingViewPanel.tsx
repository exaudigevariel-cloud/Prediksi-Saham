import React, { useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

interface TradingViewPanelProps {
  symbol: string;
  interval: string;
  studiesCsv: string;
  theme?: 'dark' | 'light';
}

const SCRIPT_SRC = 'https://s3.tradingview.com/tv.js';
const SCRIPT_ID = 'tradingview-widget-script';

function ensureTradingViewScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.TradingView?.widget) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load TradingView script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TradingView script'));
    document.head.appendChild(script);
  });
}

function toTradingViewInterval(interval: string): string {
  const normalized = interval.toLowerCase();
  const map: Record<string, string> = {
    '1m': '1',
    '2m': '2',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '60m': '60',
    '1h': '60',
    '90m': '90',
    '1d': 'D',
    '5d': 'D',
    '1wk': 'W',
    '1w': 'W',
    '1mo': 'M',
    '3mo': '3M',
  };
  return map[normalized] ?? '60';
}

export default function TradingViewPanel({ symbol, interval, studiesCsv, theme = 'dark' }: TradingViewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const studies = useMemo(
    () =>
      studiesCsv
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [studiesCsv],
  );

  const containerId = useMemo(
    () => `tv-widget-${symbol.replace(/[^A-Z0-9:_-]/gi, '').toLowerCase()}-${interval}`,
    [symbol, interval],
  );

  useEffect(() => {
    let mounted = true;

    const renderWidget = async () => {
      setLoadError(null);

      try {
        await ensureTradingViewScript();
        if (!mounted || !containerRef.current || !window.TradingView?.widget) return;

        containerRef.current.innerHTML = `<div id="${containerId}" style="height:100%;width:100%;"></div>`;

        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: toTradingViewInterval(interval),
          timezone: 'Etc/UTC',
          theme,
          style: '1',
          locale: 'en',
          enable_publishing: false,
          withdateranges: true,
          allow_symbol_change: true,
          save_image: true,
          hide_side_toolbar: false,
          studies,
          container_id: containerId,
          support_host: 'https://www.tradingview.com',
        });
      } catch (error) {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load TradingView widget');
      }
    };

    renderWidget();

    return () => {
      mounted = false;
    };
  }, [containerId, interval, studiesCsv, symbol, theme]);

  if (loadError) {
    return (
      <div className="h-full w-full rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
        TradingView widget gagal dimuat: {loadError}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
