import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Send, XCircle } from 'lucide-react';
import {
  getCountryFromPhrase,
  getCountryCoordinates,
  extractGotoCountry
} from '../services/countryCoordinates';

const BACKEND = 'http://localhost:5001';

const SYSTEM_PROMPT = `You are an AI assistant for GeoNews, an intelligence-grade geopolitical news dashboard.

IMPORTANT RULE: If the user wants to navigate to, zoom to, fly to, or see a specific place, country, city, or region, you MUST respond with ONLY a JSON object - no prose, no markdown:
{"action":"flyTo","lat":<number>,"lng":<number>,"zoom":5,"locationName":"<name>","message":"<friendly 1-line reply>"}

For all other questions answer in 2-4 sentences. You know about:
- GeoNews features: 3D globe, Leaflet 2D map at zoom>6, category filters (Geopolitics/Climate/Economy/Technology), news markers, Strategic Dashboard, 48-hour AI forecasts
- The map shows live news events as glowing markers colour-coded by category
- Users can click markers for details, use the sidebar to filter, and the Strategic Dashboard for risk forecasts`;

type ChatMessage = {
  id: number;
  from: 'user' | 'assistant';
  text: string;
};

export interface CommandAssistantProps {
  onCenterOnCountry?: (countryName: string) => void;
  onNavigateTo?: (coords: { lat: number; lng: number; zoom?: number }) => void;
}

const capitalizeCountry = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

/** User prompt sent to the AI for "Summarize latest news": top 3 only, max 100 words, fixed format. */
const SUMMARIZE_LATEST_NEWS_PROMPT = `Summarize the latest news. Your response must:
(1) Summarize only the top 3 news items
(2) Be at most 100 words total
(3) Use this exact format (plain text, no markdown like ** or other formatting). You must end each line with a newline:
\`\`\`Here's the summary of the latest news:
- [first news item]\n
- [second news item]\n
- [third news item]\n\`\`\``;

const MAX_SUMMARY_WORDS = 100;

const SUMMARY_INTRO = "Here's the summary of the latest news:";

/** Strip **, remove unnecessary headlines, enforce format and max words for summary response. */
function sanitizeSummaryResponse(text: string, maxWords: number = MAX_SUMMARY_WORDS): string {
  if (!text || typeof text !== 'string') return text;
  let out = text.replace(/\*\*/g, '').trim();
  const lines = out.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const introIdx = lines.findIndex((l) =>
    l.toLowerCase().includes("here's the summary") || l.toLowerCase().includes('summary of the latest news')
  );
  let startIdx = 0;
  if (introIdx >= 0) {
    startIdx = introIdx;
    lines[startIdx] = SUMMARY_INTRO;
  } else if (lines.length > 0 && lines[0].length <= 55 && !lines[0].endsWith('.') && !lines[0].startsWith('-')) {
    startIdx = 1;
  }
  out = lines.slice(startIdx).join('\n').trim();
  out = out.replace(/\. - /g, '.\n- ').replace(/: - /g, ':\n- ');
  const words = out.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    out = words.slice(0, maxWords).join(' ');
    out = out.replace(/\. - /g, '.\n- ').replace(/: - /g, ':\n- ');
  }
  return out;
}

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
      'Click any news marker on the map to open the Target Lock panel on the right with the TL;DR, causality chains, and a link to the source article.',
  },
];

async function askGroq(
  userMessage: string
): Promise<{ text: string; coords?: { lat: number; lng: number; zoom?: number }; gotoCountry?: string }> {
  try {
    const res = await fetch(`${BACKEND}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Backend chat error ${res.status}`);
    const data = await res.json();
    const content: string = data.content || '';

    // Try to parse as a flyTo command
    try {
      const trimmed = content.trim();
      const jsonStart = trimmed.indexOf('{');
      const jsonEnd = trimmed.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
        if (parsed.action === 'flyTo' && typeof parsed.lat === 'number') {
          return {
            text: parsed.message || `Navigating to ${parsed.locationName}.`,
            coords: { lat: parsed.lat, lng: parsed.lng, zoom: parsed.zoom },
          };
        }
      }
    } catch {
      // Not JSON - normal text response
    }

    return { text: content };
  } catch {
    // Fallback to local FAQ
    const lower = userMessage.toLowerCase();
    const countryCanonical = getCountryFromPhrase(userMessage);
    if (countryCanonical) {
      const displayName = capitalizeCountry(countryCanonical);
      return { text: `Taking you to ${displayName}.`, gotoCountry: countryCanonical };
    }
    const match = FAQ.find((item) => item.keywords.some((kw) => lower.includes(kw)));
    return {
      text: match
        ? match.answer
        : 'GeoNews AI is temporarily offline. Try asking about zoom, layers, or say \'Take me to Taiwan\'.',
    };
  }
}

/** Commands that need extra user input (e.g. country name). When set, the text input is shown. */
type PendingCommand = 'take_me_to' | null;

const CommandAssistant: React.FC<CommandAssistantProps> = ({ onCenterOnCountry, onNavigateTo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      from: 'assistant',
      text: 'Choose a command below. Some will ask for extra details.',
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingCommand, setPendingCommand] = useState<PendingCommand>(null);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (messageOverride?: string, displayOverride?: string) => {
    const apiMessage = (messageOverride ?? input.trim()).trim();
    if (!apiMessage || isThinking) return;
    const displayText = displayOverride ?? apiMessage;

    const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;
    const userMessage: ChatMessage = { id: nextId, from: 'user', text: displayText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setPendingCommand(null);
    setIsThinking(true);

    const result = await askGroq(apiMessage);

    if (result.coords && onNavigateTo) {
      onNavigateTo(result.coords);
    } else if (result.gotoCountry) {
      const rawReply = `##GOTO:${result.gotoCountry}`;
      const countryFromTag = extractGotoCountry(rawReply);
      if (countryFromTag && onCenterOnCountry) onCenterOnCountry(countryFromTag);
    }

    let replyText = result.text;
    if (displayOverride === 'Summarize latest news' || apiMessage === SUMMARIZE_LATEST_NEWS_PROMPT) {
      replyText = sanitizeSummaryResponse(replyText);
    }
    const reply: ChatMessage = { id: nextId + 1, from: 'assistant', text: replyText };
    setMessages((prev) => [...prev, reply]);
    setIsThinking(false);
  };

  /** Run a command that needs no extra input (sends to AI immediately). */
  const handleDirectCommand = (prompt: string) => {
    handleSend(prompt);
  };

  /** Open the extra-info flow (shows text input). */
  const handleCommandNeedingInput = (command: PendingCommand) => {
    setPendingCommand(command);
    setInput('');
  };

  const handleSubmitExtraInfo = () => {
    if (pendingCommand === 'take_me_to') {
      const country = input.trim();
      if (!country) return;
      const coords = getCountryCoordinates(country);
      if (!coords) {
        const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;
        setMessages((prev) => [
          ...prev,
          { id: nextId, from: 'user', text: `Take me to ${country}` },
          { id: nextId + 1, from: 'assistant', text: 'Please enter a valid country name.' },
        ]);
        setInput('');
        setPendingCommand(null);
        return;
      }
      const displayName = capitalizeCountry(coords.canonicalName);
      const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;
      setMessages((prev) => [
        ...prev,
        { id: nextId, from: 'user', text: `Take me to ${country}` },
        { id: nextId + 1, from: 'assistant', text: `Taking you to ${displayName}.` },
      ]);
      setInput('');
      setPendingCommand(null);
      onCenterOnCountry?.(coords.canonicalName);
    }
  };

  const handleCancelExtraInfo = () => {
    setPendingCommand(null);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-[9999] h-12 w-12 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/60 text-[#00f0ff] flex items-center justify-center hover:bg-[#00f0ff]/25 transition-colors"
        aria-label="Open Command Assistant"
      >
        <MessageCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
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
                        ? 'max-w-[80%] rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 px-3 py-2 text-xs text-cyan-50 font-sans whitespace-pre-line'
                        : 'max-w-[80%] rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-slate-100 font-sans whitespace-pre-line'
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
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions; text input only when a command needs extra info */}
            <div className="px-4 pb-3 pt-2 border-t border-white/10 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSend(SUMMARIZE_LATEST_NEWS_PROMPT, 'Summarize latest news')}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/20 text-[10px] text-slate-200 font-mono tracking-[0.14em] uppercase hover:bg-white/10"
                >
                  Summarize Latest News
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectCommand('Find conflict zones')}
                  className="hidden px-2.5 py-1 rounded-full bg-white/5 border border-white/20 text-[10px] text-slate-200 font-mono tracking-[0.14em] uppercase hover:bg-white/10"
                >
                  Find Conflict Zones
                </button>
                <button
                  type="button"
                  onClick={() => handleCommandNeedingInput('take_me_to')}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/20 text-[10px] text-slate-200 font-mono tracking-[0.14em] uppercase hover:bg-white/10"
                >
                  Take me to…
                </button>
              </div>

              {pendingCommand !== null && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitExtraInfo();
                      if (e.key === 'Escape') handleCancelExtraInfo();
                    }}
                    placeholder={pendingCommand === 'take_me_to' ? 'Enter country name…' : 'Extra info…'}
                    className="flex-1 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00f0ff]"
                    aria-label={pendingCommand === 'take_me_to' ? 'Country name' : 'Extra information'}
                  />
                  <button
                    type="button"
                    onClick={handleSubmitExtraInfo}
                    disabled={!input.trim() || isThinking}
                    className="h-9 w-9 rounded-full border border-[#00f0ff]/60 bg-[#00f0ff]/15 text-[#00f0ff] flex items-center justify-center hover:bg-[#00f0ff]/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Submit"
                  >
                    <Send size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelExtraInfo}
                    className="h-9 w-9 rounded-full border border-white/20 text-slate-400 flex items-center justify-center hover:bg-white/10 hover:text-slate-200"
                    aria-label="Cancel"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommandAssistant;

