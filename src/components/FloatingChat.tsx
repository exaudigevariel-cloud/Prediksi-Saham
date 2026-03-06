import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import Chatbot from './Chatbot';

interface FloatingChatProps {
  symbol: string;
  quote: any;
  signal: string;
  timeframe: string;
  analysis?: any;
}

export default function FloatingChat({ symbol, quote, signal, timeframe, analysis }: FloatingChatProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[95vw] md:w-[430px] h-[72vh] max-h-[760px] shadow-2xl">
          <button
            onClick={() => setOpen(false)}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-400 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
          <Chatbot
            symbol={symbol}
            quote={quote}
            signal={signal}
            timeframe={timeframe}
            analysis={analysis}
          />
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-[0_12px_35px_rgba(16,185,129,0.45)] hover:bg-emerald-400 transition-colors"
        aria-label="Toggle AI Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </>
  );
}
