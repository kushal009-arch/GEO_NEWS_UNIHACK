import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NewsItem } from '../types';
import { searchNews } from '../services/newsService';

const CATEGORY_COLORS: Record<string, string> = {
  Geopolitics: '#ff4d4d',
  Business: '#f1c40f',
  Technology: '#00d4ff',
  Climate: '#2ecc71',
};

interface SearchPanelProps {
  /** Click on a result -> fly the map and open detail. */
  onResultClick: (item: NewsItem) => void;
}

/**
 * Floating search input with a results dropdown.
 * Debounces queries (300ms) and queries the backend `/api/news/search` endpoint.
 */
export default function SearchPanel({ onResultClick }: SearchPanelProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Debounced search
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const items = await searchNews(q);
      setResults(items.slice(0, 12));
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  // Click-outside to collapse
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Keyboard shortcut: '/' to focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 30);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={panelRef}
      className="fixed top-[68px] left-1/2 -translate-x-1/2 z-[20] w-[min(420px,calc(100vw-32px))] pointer-events-auto md:top-6 md:left-6 md:translate-x-0 md:w-[340px]"
    >
      <div
        className={`flex items-center gap-2 rounded-full border bg-black/55 backdrop-blur-2xl transition-all duration-200 ${
          open ? 'border-cyan-300/60 shadow-[0_0_20px_rgba(0,240,255,0.18)]' : 'border-white/10'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 30);
          }}
          className="pl-4 pr-1 text-white/50 hover:text-cyan-200"
          aria-label="Search"
        >
          <Search size={14} />
        </button>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events, regions, sources..."
          className="flex-1 bg-transparent py-2 pr-2 text-[12px] text-white placeholder:text-white/35 focus:outline-none font-mono tracking-[0.04em]"
          aria-label="Search news"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="pr-3 text-white/40 hover:text-white"
            aria-label="Clear"
          >
            <X size={13} />
          </button>
        )}
        {!q && (
          <kbd className="hidden md:inline-flex items-center justify-center mr-2 px-1.5 py-0.5 rounded border border-white/15 text-[9px] font-mono text-white/40">/</kbd>
        )}
      </div>

      <AnimatePresence>
        {open && (q || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="mt-2 rounded-2xl border border-white/[0.08] bg-black/80 backdrop-blur-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            {loading && (
              <div className="flex items-center gap-2 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-white/50">
                <Loader2 size={12} className="animate-spin text-cyan-300" />
                Searching news catalogue...
              </div>
            )}
            {!loading && results.length === 0 && q && (
              <div className="px-4 py-3 text-[11px] text-white/45 font-mono">
                No results for "{q}".
              </div>
            )}
            {!loading && results.length > 0 && (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/[0.04]">
                {results.map((item) => {
                  const color = CATEGORY_COLORS[item.category] ?? '#aaaaaa';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onResultClick(item);
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.05] transition-colors group flex items-start gap-3 cursor-pointer"
                    >
                      <MapPin size={14} style={{ color }} className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8px] font-bold uppercase tracking-[0.18em] font-mono" style={{ color }}>
                            {item.category}
                          </span>
                          {item.importance >= 4 && (
                            <span className="text-[7px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-1 py-0.5 rounded">
                              High Impact
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-white/85 leading-snug line-clamp-2 group-hover:text-white">
                          {item.title}
                        </p>
                        <p className="text-[9px] text-white/35 mt-0.5 font-mono truncate">
                          {item.source}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
