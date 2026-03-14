import { useEffect, useRef, useState } from 'react';
import { NewsCategory, NewsItem } from '../types';

/** Sectors available inside the Analytics board (subset of NewsCategory). */
type AnalyticsSector = 'Geopolitics' | 'Climate' | 'Business' | 'Technology';

const analyticsSectorTabs: { value: AnalyticsSector; label: string }[] = [
  { value: 'Geopolitics', label: 'GEOPOLITICS' },
  { value: 'Climate', label: 'CLIMATE' },
  { value: 'Business', label: 'ECONOMY' },
  { value: 'Technology', label: 'TECH' }
];
import {
  Globe2,
  CloudRain,
  BarChart3,
  Cpu,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StrategicDashboard from './StrategicDashboard';

interface NavigationHubProps {
  activeCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
  isAnalyticsOpen: boolean;
  setIsAnalyticsOpen: (value: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  selectedInterests: string[];
  onToggleInterest: (interest: string) => void;
  daysAgo: number;
  setDaysAgo: (value: number) => void;
  onApplyFilters: () => void;
  onSyncNews?: () => void;
  news?: NewsItem[];
}

type DisplayCategory = {
  value: NewsCategory;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const displayCategories: DisplayCategory[] = [
  { value: 'Geopolitics', label: 'Geopolitics', icon: Globe2 },
  { value: 'Climate', label: 'Climate', icon: CloudRain },
  { value: 'Business', label: 'Economy', icon: BarChart3 },
  { value: 'Technology', label: 'Tech', icon: Cpu }
];

const signalFilters = ['Energy', 'Shipping', 'Elections', 'AI', 'Cybersecurity', 'Climate Tech'];

const CAT_COLOR: Record<string, string> = {
  Geopolitics: '#c0454a',
  Business:    '#c49a2e',
  Technology:  '#22d3ee',
  Climate:     '#4ade80',
};

const MAX_DAYS = 14;

const analyticsContent: Record<
  NewsCategory,
  {
    title: string;
    volatility: { name: string; level: string; value: number }[];
    sectors: string[];
    forecastLeft: { title: string; text: string; confidence: string };
    forecastRight: { title: string; text: string; confidence: string };
  }
> = {
  'Just In': {
    title: 'Live event dashboard',
    volatility: [
      { name: 'Breaking Events', level: 'High', value: 82 },
      { name: 'Regional Alerts', level: 'Moderate', value: 61 },
      { name: 'Signal Density', level: 'High', value: 77 }
    ],
    sectors: ['Live Events', 'Alerts', 'Watchlist'],
    forecastLeft: {
      title: 'LIVE / EVENTS',
      text: 'Incoming event clusters indicate elevated short-term volatility across multiple monitored regions.',
      confidence: '79%'
    },
    forecastRight: {
      title: 'LIVE / ALERTS',
      text: 'Watchlist escalation may occur if new geopolitical or logistical events emerge within the next cycle.',
      confidence: '76%'
    }
  },
  'For You': {
    title: 'Personalized intelligence dashboard',
    volatility: [
      { name: 'Tracked Interests', level: 'High', value: 85 },
      { name: 'Travel Routes', level: 'Moderate', value: 58 },
      { name: 'Custom Alerts', level: 'High', value: 80 }
    ],
    sectors: ['Custom Alerts', 'Routes', 'Interests'],
    forecastLeft: {
      title: 'PERSONAL / IMPACT',
      text: 'Events near your selected routes and interests show elevated disruption probability.',
      confidence: '84%'
    },
    forecastRight: {
      title: 'PERSONAL / WATCHLIST',
      text: 'Custom monitoring suggests your selected sectors may face short-term operational volatility.',
      confidence: '81%'
    }
  },
  Geopolitics: {
    title: 'Strategic risk & trend dashboard',
    volatility: [
      { name: 'Suez Corridor', level: 'Severe', value: 92 },
      { name: 'Taiwan Strait', level: 'High', value: 74 },
      { name: 'Panama Canal', level: 'Moderate', value: 53 }
    ],
    sectors: ['Suez Corridor', 'Taiwan Strait', 'Panama Canal'],
    forecastLeft: {
      title: 'GEOPOLITICAL / TRADE',
      text: 'Supply chain disruption is highly probable in the Red Sea corridor within 48 hours. Rerouting models indicate ~14 day delay on critical freight.',
      confidence: '85%'
    },
    forecastRight: {
      title: 'TECH / MARKET',
      text: 'Export restrictions and regional pressure points may increase hardware and shipping volatility across strategic corridors.',
      confidence: '78%'
    }
  },
  Business: {
    title: 'Economic risk & trade dashboard',
    volatility: [
      { name: 'Oil Market', level: 'High', value: 79 },
      { name: 'Container Freight', level: 'Moderate', value: 62 },
      { name: 'Currency Pressure', level: 'Moderate', value: 57 }
    ],
    sectors: ['Oil Market', 'Freight', 'Currencies'],
    forecastLeft: {
      title: 'ECONOMY / TRADE',
      text: 'Freight cost pressure and energy instability may raise short-term logistics costs across Asia-Europe trade routes.',
      confidence: '82%'
    },
    forecastRight: {
      title: 'MARKET / CAPITAL',
      text: 'Risk-off sentiment may affect equities exposed to shipping, oil, and import-dependent supply chains.',
      confidence: '74%'
    }
  },
  Climate: {
    title: 'Climate risk & anomaly dashboard',
    volatility: [
      { name: 'Flood Zones', level: 'High', value: 81 },
      { name: 'Heat Stress', level: 'Severe', value: 90 },
      { name: 'Crop Volatility', level: 'Moderate', value: 59 }
    ],
    sectors: ['Flood Zones', 'Heat Stress', 'Crop Volatility'],
    forecastLeft: {
      title: 'CLIMATE / INFRASTRUCTURE',
      text: 'Extreme weather concentration is likely to disrupt regional infrastructure and increase insurance exposure.',
      confidence: '88%'
    },
    forecastRight: {
      title: 'CLIMATE / FOOD SYSTEMS',
      text: 'Agricultural output may weaken in exposed regions if current heat and rainfall anomalies continue.',
      confidence: '80%'
    }
  },
  Technology: {
    title: 'Technology risk & intelligence dashboard',
    volatility: [
      { name: 'AI Compute', level: 'High', value: 77 },
      { name: 'Cyber Threat', level: 'High', value: 76 },
      { name: 'Chip Supply', level: 'Moderate', value: 60 }
    ],
    sectors: ['AI Compute', 'Cyber Threat', 'Chip Supply'],
    forecastLeft: {
      title: 'TECH / INFRA',
      text: 'Compute bottlenecks and export restrictions may intensify hardware competition across major AI ecosystems.',
      confidence: '83%'
    },
    forecastRight: {
      title: 'CYBER / SYSTEMS',
      text: 'Threat activity may increase around high-value infrastructure and cross-border digital systems.',
      confidence: '77%'
    }
  }
};

export default function NavigationHub({
  activeCategory,
  onCategoryChange,
  isAnalyticsOpen,
  setIsAnalyticsOpen,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedInterests,
  onToggleInterest,
  daysAgo,
  setDaysAgo,
  onApplyFilters,
  onSyncNews,
  news
}: NavigationHubProps) {
  const [activeAnalyticsSector, setActiveAnalyticsSector] = useState<AnalyticsSector>('Geopolitics');
  const currentAnalytics = analyticsContent[activeAnalyticsSector] ?? analyticsContent.Geopolitics;
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const analyticsRef = useRef<HTMLDivElement | null>(null);

  // Global click-outside handler for both drawer and analytics
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;

      if (isSidebarOpen && drawerRef.current && target && !drawerRef.current.contains(target)) {
        setIsSidebarOpen(false);
      }

      if (isAnalyticsOpen && analyticsRef.current && target && !analyticsRef.current.contains(target)) {
        setIsAnalyticsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen, isAnalyticsOpen, setIsSidebarOpen, setIsAnalyticsOpen]);

  return (
    <>
      {/* Branding anchored top-right */}
      <div className="fixed top-6 right-6 z-[10] flex flex-col items-end gap-2">
        <div className="rounded-[28px] border border-[rgba(0,242,255,0.1)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] px-5 py-2 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
          <span className="text-[20px] font-semibold tracking-[0.3em] text-cyan-100 uppercase font-mono">
            GEONEWS
          </span>
        </div>
      </div>

      {/* Analytics button centered top-middle */}
      <div className="fixed top-6 left-1/2 z-[10] -translate-x-1/2">
        <button
          onClick={() => {
            setIsAnalyticsOpen(!isAnalyticsOpen);
            if (!isAnalyticsOpen) {
              // When opening analytics, tuck the nav drawer away for clarity
              setIsSidebarOpen(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,242,255,0.35)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] px-5 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-100 hover:border-cyan-300 transition"
        >
          <BarChart3 size={14} />
          <span>// ANALYTICS</span>
        </button>
      </div>

      {/* Navigation drawer + toggle - vertically centered left */}
      <div
        ref={drawerRef}
        className="fixed left-0 top-1/2 z-[10] -translate-y-1/2 flex items-center gap-2"
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="h-14 w-10 rounded-r-2xl border border-white/15 bg-black/70 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white hover:border-cyan-300 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex flex-col gap-4 ml-2 mr-4 backdrop-blur-[10px]"
            >
            {/* News Categories - bottom-left above temporal filter */}
            <div className="w-[280px] max-w-[calc(100vw-80px)] rounded-[20px] border border-[rgba(0,242,255,0.1)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] px-3 pt-2 pb-3">
              <div className="mb-2 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-400">
                // SECTOR_SELECT
              </div>

              {/* "All" toggle - shows all categories on the map */}
              <button
                onClick={() => onCategoryChange('Just In')}
                className={`w-full mb-2.5 rounded-[14px] border px-3 py-2.5 flex items-center justify-center gap-2 transition ${
                  activeCategory === 'Just In' || activeCategory === 'For You'
                    ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(0,240,255,0.15)]'
                    : 'border-white/15 text-white/65 hover:border-white/30'
                }`}
              >
                <Layers size={15} />
                <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em]">
                  All Sectors
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                {displayCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.value;
                  const catColor = CAT_COLOR[category.value] ?? '#22d3ee';

                  return (
                    <button
                      key={category.value}
                      onClick={() => {
                        // Toggle: clicking active category resets to All
                        if (isActive) {
                          onCategoryChange('Just In');
                        } else {
                          onCategoryChange(category.value);
                        }
                      }}
                      className={`rounded-[14px] border px-3 py-3 min-h-[84px] flex flex-col items-center justify-center gap-2 transition ${
                        isActive ? 'bg-white/[0.04]' : 'border-white/15 text-white/65'
                      }`}
                      style={isActive
                        ? { borderColor: catColor + 'bb', color: catColor, boxShadow: `0 0 18px ${catColor}22` }
                        : undefined
                      }
                    >
                      <div
                        className="w-2 h-2 rounded-full mb-0.5 opacity-60"
                        style={{ background: catColor }}
                      />
                      <Icon size={18} />
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em]">
                        {category.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hashtag filters integrated under categories, above temporal filter */}
            <div className="w-[280px] rounded-[20px] border border-[rgba(0,242,255,0.1)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] px-3 py-2">
              <div className="mb-2 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-400">
                // SIGNAL_FILTERS
              </div>
              <div className="flex flex-wrap gap-1.5">
                {signalFilters.map((filter) => {
                  const isSelected = selectedInterests.includes(filter);
                  return (
                    <button
                      key={filter}
                      onClick={() => onToggleInterest(filter)}
                      className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] transition ${
                        isSelected
                          ? 'border-cyan-300 text-cyan-200'
                          : 'border-white/20 text-white/60 hover:border-cyan-300 hover:text-cyan-200'
                      }`}
                    >
                      #{filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Temporal Filter - placed at bottom of drawer group */}
            <div className="w-[280px] rounded-[20px] border border-[rgba(0,242,255,0.1)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-cyan-300 text-[11px] font-mono font-semibold uppercase tracking-[0.18em]">
                  Temporal Filter
                </div>
                <span className="rounded-md bg-white/10 px-2 py-1 text-[9px] uppercase tracking-wider text-white/70">
                  {daysAgo === 0 ? 'Live' : `${daysAgo}d ago`}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={MAX_DAYS}
                step={1}
                value={MAX_DAYS - daysAgo}
                onChange={(e) => setDaysAgo(MAX_DAYS - Number(e.target.value))}
                className="w-full accent-cyan-300"
              />

              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-white/50">
                <span>Past Days</span>
                <span className="text-cyan-300">Live</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onApplyFilters();
                  setIsSidebarOpen(false);
                }}
                className="mt-4 w-full rounded-full border border-cyan-300/70 bg-cyan-400/15 px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_18px_rgba(0,240,255,0.3)] hover:bg-cyan-400/30 hover:border-cyan-200 transition-colors"
              >
                Set Filters
              </button>

              <button
                type="button"
                onClick={onSyncNews}
                className="mt-3 w-full rounded-full border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-emerald-300 hover:bg-emerald-400/20 hover:border-emerald-300 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              >
                // SYNC_LIVE_DATA
              </button>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAnalyticsOpen && (
          <StrategicDashboard onClose={() => setIsAnalyticsOpen(false)} news={news} />
        )}
      </AnimatePresence>
    </>
  );
}
