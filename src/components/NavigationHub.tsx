import { useEffect, useRef, useState } from 'react';
import { NewsCategory } from '../types';

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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  onApplyFilters
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

      {/* Navigation drawer + toggle – vertically centered left */}
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
            {/* News Categories – bottom-left above temporal filter */}
            <div className="w-[280px] max-w-[calc(100vw-80px)] rounded-[20px] border border-[rgba(0,242,255,0.1)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] px-3 pt-2 pb-3">
              <div className="mb-2 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-400">
                // SECTOR_SELECT
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {displayCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.value;

                  return (
                    <button
                      key={category.value}
                      onClick={() => onCategoryChange(category.value)}
                      className={`rounded-[14px] border px-3 py-3 min-h-[84px] flex flex-col items-center justify-center gap-2 transition ${
                        isActive
                          ? 'border-cyan-300 text-cyan-200'
                          : 'border-white/20 text-white/75 hover:border-cyan-300 hover:text-cyan-200'
                      }`}
                    >
                      <Icon size={20} />
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

            {/* Temporal Filter – placed at bottom of drawer group */}
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
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAnalyticsOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-[100] bg-[rgba(0,0,0,0.45)] backdrop-blur-[20px] flex items-center justify-center p-4"
          >
            <div
              ref={analyticsRef}
              className="w-full max-w-[1000px] max-h-[80vh] flex flex-col rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.8)] backdrop-blur-[25px] shadow-[0_0_45px_rgba(0,0,0,0.85)] font-sans"
            >
              {/* Sticky header: title + sector tabs (instant switch) + close */}
              <div className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-[rgba(0,0,0,0.9)] backdrop-blur-xl rounded-t-[24px] px-5 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-cyan-300 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] mb-0.5">
                      GEONEWS AI
                    </div>
                    <h2 className="text-[16px] font-semibold text-white tracking-tight leading-tight">
                      {currentAnalytics.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsAnalyticsOpen(false)}
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Close Analytics"
                  >
                    <X size={16} />
                  </button>
                </div>
                {/* Category tabs: GEOPOLITICS, CLIMATE, ECONOMY, TECH – updates charts/data instantly (read-only view) */}
                <nav className="mt-3 flex flex-wrap gap-0.5 border-b border-white/5 -mb-px" aria-label="Analytics sectors">
                  {analyticsSectorTabs.map((tab) => {
                    const isActive = activeAnalyticsSector === tab.value;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setActiveAnalyticsSector(tab.value)}
                        type="button"
                        className={`px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] transition-colors border-b-2 -mb-px ${
                          isActive
                            ? 'text-cyan-200 border-cyan-400'
                            : 'text-white/60 border-transparent hover:text-white/90 hover:border-white/20'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Scrollable body: compact typography (12–14px data, 16px headers) */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 text-white analytics-scroll min-h-0">
                <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-cyan-400/15 pb-3">
                  <span className="text-cyan-300 text-[11px] font-mono font-semibold uppercase tracking-[0.16em]">
                    Regional Volatility · Signal Layers
                  </span>
                  <div className="ml-auto flex flex-wrap gap-1.5">
                    {['Live Conflict', 'Trade Routes', 'Climatic Anomalies'].map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-cyan-200"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-5">
                  <div className="rounded-[16px] border border-cyan-400/15 bg-black/40 p-4 min-h-0">
                    <div className="mb-3 text-cyan-300 text-[14px] font-semibold uppercase tracking-[0.14em]">
                      Regional Volatility
                    </div>
                    <div className="space-y-4">
                      {currentAnalytics.volatility.map((item) => (
                        <div key={item.name} className="min-h-[40px]">
                          <div className="mb-1 flex items-center justify-between text-[12px] uppercase tracking-[0.1em]">
                            <span className="text-white/90">{item.name}</span>
                            <span className={`font-semibold ${getLevelTextClass(item.level)}`}>
                              {item.level}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
                            <div
                              className={`h-full rounded-full ${getLevelBarClass(item.level)}`}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5 min-w-0">
                    <div className="rounded-[16px] border border-cyan-400/15 bg-black/40 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-cyan-300 text-[14px] font-semibold uppercase tracking-[0.14em]">
                          Vector Risk Heatmap
                        </span>
                        <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-red-200">
                          High-Risk Sectors
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {currentAnalytics.sectors.map((sector, index) => (
                          <div
                            key={sector}
                            className={`rounded-[12px] border p-3 min-h-[72px] ${
                              index === 0 ? 'border-red-400/30 bg-red-400/10' : 'border-yellow-300/25 bg-yellow-300/8'
                            }`}
                          >
                            <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/90">
                              {sector}
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${index === 0 ? 'bg-red-400' : 'bg-yellow-300'}`}
                                style={{ width: `${index === 0 ? 82 : index === 1 ? 58 : 44}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-[16px] border border-cyan-400/15 bg-black/40 p-4 min-h-0">
                        <div className="mb-3 text-cyan-300 text-[14px] font-semibold uppercase tracking-[0.14em]">
                          Neural Network Forecasts
                        </div>
                        <div className="rounded-[14px] border border-red-400/20 bg-red-400/10 p-4 min-h-[160px] flex flex-col">
                          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/90 mb-2">
                            {currentAnalytics.forecastLeft.title}
                          </div>
                          <p className="text-[13px] text-white/85 leading-snug flex-1">
                            {currentAnalytics.forecastLeft.text}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full border border-red-400/25 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-red-200">
                              Confidence: {currentAnalytics.forecastLeft.confidence}
                            </span>
                            <button
                              type="button"
                              className="rounded-full border border-cyan-300/30 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                            >
                              Focus Map
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-cyan-400/15 bg-black/40 p-4 min-h-0">
                        <div className="mb-3 text-cyan-300 text-[14px] font-semibold uppercase tracking-[0.14em]">
                          Neural Network Forecasts
                        </div>
                        <div className="rounded-[14px] border border-cyan-400/20 bg-cyan-400/8 p-4 min-h-[160px] flex flex-col">
                          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/90 mb-2">
                            {currentAnalytics.forecastRight.title}
                          </div>
                          <p className="text-[13px] text-white/85 leading-snug flex-1">
                            {currentAnalytics.forecastRight.text}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full border border-cyan-400/25 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-cyan-200">
                              Confidence: {currentAnalytics.forecastRight.confidence}
                            </span>
                            <button
                              type="button"
                              className="rounded-full border border-cyan-300/30 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                            >
                              Focus Map
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function getLevelTextClass(level: string) {
  if (level === 'Severe') return 'text-red-400';
  if (level === 'High') return 'text-yellow-300';
  return 'text-cyan-300';
}

function getLevelBarClass(level: string) {
  if (level === 'Severe') return 'bg-red-400';
  if (level === 'High') return 'bg-yellow-300';
  return 'bg-cyan-300';
}
