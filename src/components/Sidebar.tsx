import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe,
  Image as ImageIcon,
  Loader2,
  Newspaper,
  Search,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { NewsCategory } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categories: NewsCategory[] = [
  'Just In',
  'For You',
  'Geopolitics',
  'Business',
  'Technology',
  'Climate',
];

interface SidebarProps {
  activeCategory?: NewsCategory;
  onCategoryChange?: (category: NewsCategory) => void;
  showHeatmap?: boolean;
  setShowHeatmap?: (show: boolean) => void;
  showSentiment?: boolean;
  setShowSentiment?: (show: boolean) => void;
}

export default function Sidebar({
  activeCategory: controlledCategory,
  onCategoryChange,
  showHeatmap = false,
  setShowHeatmap,
  showSentiment = false,
  setShowSentiment,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [localCategory, setLocalCategory] = useState<NewsCategory>('Geopolitics');
  const [activeTab, setActiveTab] = useState<'news' | 'trends' | 'image' | 'personal'>('news');
  const [localHeatmap, setLocalHeatmap] = useState(false);
  const [localSentiment, setLocalSentiment] = useState(false);

  const activeCategory = controlledCategory ?? localCategory;
  const setActiveCategory = onCategoryChange ?? setLocalCategory;
  const heatmap = setShowHeatmap ? showHeatmap : localHeatmap;
  const setHeatmap = setShowHeatmap ?? setLocalHeatmap;
  const sentiment = setShowSentiment ? showSentiment : localSentiment;
  const setSentiment = setShowSentiment ?? setLocalSentiment;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-[90] flex h-full flex-col border-r border-white/10 bg-black/90 backdrop-blur-md transition-all duration-300',
        isOpen ? 'w-80' : 'w-16'
      )}
    >
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/70 shadow-lg backdrop-blur-xl hover:border-cyan-300/50 hover:text-white transition-colors"
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-400/30">
          <Globe className="text-cyan-300" size={20} />
        </div>
        {isOpen && (
          <h1 className="text-lg font-semibold uppercase tracking-[0.1em] text-[var(--color-neon-blue)] font-sans">
            Globe News
          </h1>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 p-2">
        <button
          type="button"
          onClick={() => setActiveTab('news')}
          className={cn(
            'flex flex-1 items-center justify-center rounded-md py-2 transition-colors',
            activeTab === 'news'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-gray-300'
          )}
          title="News"
        >
          <Newspaper size={20} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={cn(
            'flex flex-1 items-center justify-center rounded-md py-2 transition-colors',
            activeTab === 'trends'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-gray-300'
          )}
          title="Trends"
        >
          <TrendingUp size={20} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={cn(
            'flex flex-1 items-center justify-center rounded-md py-2 transition-colors',
            activeTab === 'personal'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-gray-300'
          )}
          title="Personal"
        >
          <Search size={20} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={cn(
            'flex flex-1 items-center justify-center rounded-md py-2 transition-colors',
            activeTab === 'image'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-gray-300'
          )}
          title="Image Analysis"
        >
          <ImageIcon size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 analytics-scroll">
        {isOpen && (
          <AnimatePresence mode="wait">
            {activeTab === 'news' && (
              <motion.div
                key="news"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    <Filter size={12} /> Categories
                  </h2>
                  <div className="grid grid-cols-1 gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          'rounded-lg px-3 py-2 text-left text-sm transition-all',
                          activeCategory === cat
                            ? 'border border-cyan-400/30 bg-cyan-500/20 text-cyan-300'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="border-t border-white/10 pt-4">
                  <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Intelligence Layers
                  </h2>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-between group">
                      <span className="text-sm text-gray-400 transition-colors group-hover:text-white">
                        Sentiment Mood
                      </span>
                      <input
                        type="checkbox"
                        checked={sentiment}
                        onChange={(e) => setSentiment(e.target.checked)}
                        className="h-4 w-4 accent-cyan-500"
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between group">
                      <span className="text-sm text-gray-400 transition-colors group-hover:text-white">
                        Information Vacuum
                      </span>
                      <input
                        type="checkbox"
                        checked={heatmap}
                        onChange={(e) => setHeatmap(e.target.checked)}
                        className="h-4 w-4 accent-cyan-500"
                      />
                    </label>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'trends' && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                  Global Trends
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <Loader2 size={24} className="mx-auto mb-2 animate-spin text-cyan-400" />
                  <p className="text-xs text-gray-400">Trend analysis will appear here.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                  My Interests
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-gray-400">Add supply chain and travel interests here.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'image' && (
              <motion.div
                key="image"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                  Image Analysis
                </h2>
                <div className="rounded-xl border-2 border-dashed border-white/10 p-8 text-center">
                  <ImageIcon className="mx-auto mb-2 text-gray-500" size={32} />
                  <p className="text-xs text-gray-400">Upload a news image for AI analysis.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {isOpen && (
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
            Live AI Monitoring Active
          </div>
        </div>
      )}
    </div>
  );
}
