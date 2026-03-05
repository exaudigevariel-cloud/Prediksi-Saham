import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalysisContext {
  signal?: 'BUY' | 'SELL' | 'HOLD';
  confidence?: number;
  entry?: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  trend?: string;
  reason?: string[];
  warnings?: string[];
  backtest?: {
    trades?: number;
    winRate?: number | null;
    maxDrawdown?: number | null;
  };
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface ChatbotProps {
  symbol: string;
  quote: any;
  signal: string;
  timeframe: string;
  analysis?: AnalysisContext | null;
}

function buildWelcomeMessage(symbol: string, timeframe: string, signal: string, analysis?: AnalysisContext | null) {
  const confidence = typeof analysis?.confidence === 'number' ? `${analysis.confidence.toFixed(0)}%` : '--';
  return `Hello! I am ARCHITECT-OMNI-9000. I am tracking **${symbol}** on **${timeframe}**.

- Active signal: **${signal}**
- Model confidence: **${confidence}**
- Ask for setup validation, invalidation level, or risk sizing.`;
}

export default function Chatbot({ symbol, quote, signal, timeframe, analysis }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: buildWelcomeMessage(symbol, timeframe, signal, analysis),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          role: 'ai',
          content: buildWelcomeMessage(symbol, timeframe, signal, analysis),
        }];
      }

      return [
        ...prev,
        {
          id: `ctx-${Date.now()}`,
          role: 'ai',
          content: `Context updated to **${symbol}** (${timeframe}). Current signal: **${signal}**.`,
        },
      ];
    });
  }, [symbol, timeframe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            symbol,
            price: quote?.regularMarketPrice,
            change: quote?.regularMarketChangePercent,
            signal,
            timeframe,
            analysis,
          }
        })
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I encountered an error while generating a response. Please retry in a few seconds."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <Bot className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            Architect-19 <Sparkles className="w-3 h-3 text-emerald-400" />
          </h3>
          <p className="text-xs text-emerald-500/80 font-mono">Online | Analyzing {symbol}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-zinc-800' : 'bg-emerald-500/20 border border-emerald-500/30'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Bot className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-zinc-800/80 text-zinc-300 rounded-tl-none border border-zinc-700/50'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="bg-zinc-800/80 rounded-2xl rounded-tl-none p-4 border border-zinc-700/50 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about entry points, trends..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
