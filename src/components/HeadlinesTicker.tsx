import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NewsItem } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  Geopolitics: '#ff4d4d',
  Business:    '#f1c40f',
  Technology:  '#00F5FF',
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

    return [...filtered].sort((a, b) => b.importance - a.importance).slice(0, 7);
  }, [news, bounds, zoom]);

  if (topHeadlines.length === 0) return null;

  const gridId = regionLabel
    ? `GRID_${(regionLabel.charCodeAt(0) % 10).toString().padStart(2, '0')}`
    : 'GRID_01';
  const regionStr = regionLabel ? `${regionLabel} // ${gridId}` : `SE_ASIA // ${gridId}`;

  return (
    <div className="hidden md:flex fixed right-8 top-24 z-40 w-80 h-[calc(100vh-180px)] flex-col pointer-events-auto">
      <div className="glass flex flex-col h-full rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.03] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse shadow-[0_0_6px_rgba(0,245,255,0.7)]" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-white/80">
              Intelligence_Feed
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#A1A1A1] uppercase tracking-wider truncate max-w-[120px]">
            {regionStr}
          </span>
        </div>

        {/* Timeline body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 relative custom-scrollbar">
          <div className="timeline-line" />
          <AnimatePresence mode="popLayout">
            {topHeadlines.map((item, i) => {
              const color = CATEGORY_COLORS[item.category] ?? '#A1A1A1';
              const isHigh = item.importance >= 4;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative pl-8 group cursor-pointer"
                  onClick={() => onHeadlineClick(item)}
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-[16px] top-2 w-2 h-2 rounded-full border-2 z-10 ${isHigh ? 'animate-pulse' : ''}`}
                    style={{ background: isHigh ? '#FF3B30' : color, borderColor: '#0c0f0f' }}
                  />

                  <div className={`p-3 rounded-lg border transition-all ${
                    isHigh
                      ? 'border-[#FF3B30]/30 bg-[#FF3B30]/[0.04] group-hover:bg-[#FF3B30]/[0.08]'
                      : 'border-white/[0.06] group-hover:border-white/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {isHigh && (
                        <span className="text-[8px] font-mono text-[#FF3B30] uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#FF3B30] inline-block animate-pulse" />
                          Critical_Alert
                        </span>
                      )}
                      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color }}>
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-[12px] font-semibold leading-snug mb-1.5 text-white/85 group-hover:text-[#00F5FF] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-[9px] font-mono text-[#A1A1A1] uppercase tracking-wider">
                      {item.source}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
          <button className="w-full glass py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 text-[#00F5FF] border border-[#00F5FF]/20 hover:bg-[#00F5FF]/[0.06] transition-colors">
            <RefreshCw size={11} />
            Sync_Stream
          </button>
        </div>
      </div>
    </div>
  );
}

