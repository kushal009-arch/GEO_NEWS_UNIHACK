import { useMemo } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NewsItem } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  Geopolitics: '#ff4d4d',
  Business:    '#f1c40f',
  Technology:  '#00d4ff',
  Climate:     '#2ecc71',
};

interface HeadlinesTickerProps {
  news: NewsItem[];
  regionLabel: string | null;
  onHeadlineClick: (item: NewsItem) => void;
  bounds?: any;
  zoom?: number;
}

export default function HeadlinesTicker({ news, regionLabel, onHeadlineClick, bounds, zoom }: HeadlinesTickerProps) {
  const topHeadlines = useMemo(() => {
    let filtered = news;

    // When zoomed in, filter to visible bounds so headlines match the region
    if (bounds && zoom && zoom >= 3) {
      try {
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
        if (Number.isFinite(north) && Number.isFinite(south)) {
          const latPad = (north - south) * 0.15;
          const lngPad = (east - west) * 0.15;
          filtered = filtered.filter((item) =>
            item.lat >= south - latPad && item.lat <= north + latPad &&
            item.lng >= west - lngPad && item.lng <= east + lngPad
          );
        }
      } catch { /* bounds may not be ready */ }
    }

    // Sort by importance, then take top 5
    return [...filtered]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
  }, [news, bounds, zoom]);

  if (topHeadlines.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[100] pointer-events-auto max-w-[360px]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(255,0,0,0.5)]" />
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-white/60">
            {regionLabel ? `${regionLabel} · Live Feed` : 'Global · Live Feed'}
          </span>
        </div>

        {/* Headlines list */}
        <div className="divide-y divide-white/[0.04]">
          <AnimatePresence mode="popLayout">
            {topHeadlines.map((item, i) => {
              const color = CATEGORY_COLORS[item.category] ?? '#aaaaaa';
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onHeadlineClick(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] transition-colors group flex items-start gap-3 cursor-pointer"
                >
                  {/* Location pin icon */}
                  <div className="shrink-0 mt-0.5">
                    <MapPin size={14} style={{ color }} className="drop-shadow-sm" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[8px] font-bold uppercase tracking-[0.15em] font-mono"
                        style={{ color }}
                      >
                        {item.category}
                      </span>
                      {item.importance >= 4 && (
                        <span className="text-[7px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-1 py-0.5 rounded">
                          High Impact
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[9px] text-white/30 mt-0.5 font-mono">
                      {item.source}
                    </p>
                  </div>

                  <ChevronRight size={12} className="shrink-0 text-white/20 group-hover:text-white/50 mt-2 transition-colors" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
