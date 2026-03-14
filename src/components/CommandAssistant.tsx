import React, { useState } from 'react';
import { MessageCircle, X, Minus, Send } from 'lucide-react';
import {
  getCountryFromPhrase,
  stripGotoTag,
  extractGotoCountry
} from '../services/countryCoordinates';

type ChatMessage = {
  id: number;
  from: 'user' | 'assistant';
  text: string;
};

export interface CommandAssistantProps {
  onCenterOnCountry?: (countryName: string) => void;
}

const capitalizeCountry = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['zoom', 'in', 'out'],
    answer:
      'Use your mouse scroll or trackpad pinch to zoom. At higher zoom levels, GeoNews automatically switches to a detailed 2D tile view.',
  },
  {
    keywords: ['red', 'risk', 'alert'],
    answer:
      'Red-highlighted regions indicate elevated geopolitical or trade risk based on recent signals in the Vector Risk Heatmap.',
  },
  {
    keywords: ['temporal', 'time', 'slider'],
    answer:
      'The Temporal Filter at the bottom controls how far back in time GeoNews scans. Drag it left for past events or to Live for the most recent data.',
  },
  {
    keywords: ['analytics', 'predictions', 'panel'],
    answer:
      'Click the Analytics & Predictions button in the top bar to open the command center view with diagnostics, regional volatility, and neural forecasts.',
  },
  {
    keywords: ['layers', 'categories'],
    answer:
      'Use the left-side controls to toggle interest layers and switch between Geopolitics, Climate, Economy, and Tech categories.',
  },
  {
    keywords: ['conflict', 'zones'],
    answer:
      'Select the Geopolitics category and zoom toward key corridors like the Red Sea, Taiwan Strait, or Panama Canal to inspect elevated risk zones.',
  },
  {
    keywords: ['news', 'details', 'article'],
    answer:
      'Click any news marker ring on the map to open the Target Lock panel on the right with the TL;DR, causality chains, and a link to the source article.',
  },
];

const CommandAssistant: React.FC<CommandAssistantProps> = ({ onCenterOnCountry }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      from: 'assistant',
      text: 'Command Assistant online. Ask about controls, layers, or try "Take me to India".',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;
    const userMessage: ChatMessage = { id: nextId, from: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    const lower = trimmed.toLowerCase();
    const countryCanonical = getCountryFromPhrase(trimmed);

    const buildReply = (): string => {
      if (countryCanonical) {
        const displayName = capitalizeCountry(countryCanonical);
        return `Taking you to ${displayName}. ##GOTO:${countryCanonical}`;
      }
      const match = FAQ.find((item) => item.keywords.some((kw) => lower.includes(kw)));
      return match
        ? match.answer
        : 'Routing to Intelligence Core... (This prototype build uses a local help model only.)';
    };

    setTimeout(() => {
      const rawReply = buildReply();
      const countryFromTag = extractGotoCountry(rawReply);
      const displayText = stripGotoTag(rawReply);

      if (countryFromTag && onCenterOnCountry) {
        onCenterOnCountry(countryFromTag);
      }

      const reply: ChatMessage = {
        id: nextId + 1,
        from: 'assistant',
        text: displayText,
      };
      setMessages((prev) => [...prev, reply]);
      setIsThinking(false);
    }, 350);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className="fixed bottom-20 right-6 z-[9999] h-12 w-12 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/60 text-[#00f0ff] flex items-center justify-center hover:bg-[#00f0ff]/25 transition-colors"
        aria-label="Open Command Assistant"
      >
        <MessageCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-[9999] flex flex-col items-end">
      <div className="w-[340px] h-[480px] rounded-2xl border border-[rgba(0,242,255,0.2)] flex flex-col backdrop-blur-[16px] bg-[rgba(10,20,25,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex flex-col">
            <span className="text-xs font-mono tracking-[0.16em] uppercase text-cyan-200">
              Command Assistant
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-[0.12em] uppercase">
              AI_CORE // HELP_CONSOLE
            </span>
          </div>
            <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMinimized((m) => !m)}
              className="h-7 w-7 rounded-full border border-white/20 text-slate-300 hover:bg-white/10 flex items-center justify-center text-xs"
              aria-label="Minimize assistant"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full border border-white/20 text-slate-300 hover:bg-white/10 flex items-center justify-center"
              aria-label="Close assistant"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={
                      m.from === 'user'
                        ? 'max-w-[80%] rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 px-3 py-2 text-xs text-cyan-50 font-sans'
                        : 'max-w-[80%] rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-slate-100 font-sans'
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="mt-1 text-[10px] text-cyan-200 font-mono tracking-[0.16em] uppercase">
                  AI is typing...
                </div>
              )}
            </div>

            {/* Quick actions & input */}
            <div className="px-4 pb-3 pt-2 border-t border-white/10 space-y-2">
              <div className="flex flex-wrap gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => handleQuickAction('Summarize latest news')}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/20 text-[10px] text-slate-200 font-mono tracking-[0.14em] uppercase hover:bg-white/10"
                >
                  Summarize Latest News
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('Find conflict zones')}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/20 text-[10px] text-slate-200 font-mono tracking-[0.14em] uppercase hover:bg-white/10"
                >
                  Find Conflict Zones
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('Take me to India')}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/20 text-[10px] text-slate-200 font-mono tracking-[0.14em] uppercase hover:bg-white/10"
                >
                  Take me to India
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask how to use GeoNews..."
                  className="flex-1 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00f0ff]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="h-9 w-9 rounded-full border border-[#00f0ff]/60 bg-[#00f0ff]/15 text-[#00f0ff] flex items-center justify-center hover:bg-[#00f0ff]/30 transition-colors"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommandAssistant;
