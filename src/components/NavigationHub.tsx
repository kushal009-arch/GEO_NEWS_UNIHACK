import { NewsCategory } from '../types';
import {
  Activity,
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
  setDaysAgo
}: NavigationHubProps) {
  const currentAnalytics = analyticsContent[activeCategory] ?? analyticsContent.Geopolitics;

  return (
    <>
      <div className="fixed top-7 left-1/2 z-[1200] -translate-x-1/2 w-[min(800px,82vw)]">
        <div className="rounded-full border border-cyan-400/20 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.08)] px-6 py-3 flex items-center justify-between">
          <div className="text-cyan-100 tracking-[0.25em] text-sm font-semibold uppercase">
            GEONEWS
          </div>

          <button
            onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
            className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-6 py-2 text-sm font-semibold uppercase tracking-wider text-cyan-100 hover:bg-cyan-400/10 transition"
          >
            <Activity size={16} />
            Analytics & Predictions
          </button>
        </div>
      </div>

      <div className="fixed left-0 top-1/2 z-[1100] -translate-y-1/2">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="h-14 w-14 rounded-r-2xl border border-white/10 bg-black/70 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white"
        >
          {isSidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="fixed left-8 top-[220px] z-[1100] flex flex-col gap-4"
          >
            <div className="w-[230px] rounded-[22px] border border-cyan-400/20 bg-black/60 backdrop-blur-xl p-5 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
              <div className="mb-4 flex items-center gap-3 text-white/80">
                <Shield size={15} />
                <span className="text-[11px] font-semibold tracking-[0.22em] uppercase">
                  Signal Filters
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {signalFilters.map((filter) => {
                  const isSelected = selectedInterests.includes(filter);
                  return (
                    <button
                      key={filter}
                      onClick={() => onToggleInterest(filter)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${isSelected
                          ? 'border-cyan-300 bg-cyan-400/15 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.15)]'
                          : 'border-white/10 bg-white/5 text-white/55 hover:text-white/80'
                        }`}
                    >
                      #{filter}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-[360px] max-w-[calc(100vw-64px)] rounded-[22px] border border-cyan-400/20 bg-black/60 backdrop-blur-xl p-3 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
              <div className="grid grid-cols-2 gap-3">
                {displayCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.value;

                  return (
                    <button
                      key={category.value}
                      onClick={() => onCategoryChange(category.value)}
                      className={`rounded-[16px] border p-4 min-h-[96px] flex flex-col items-center justify-center gap-3 transition ${isActive
                          ? 'border-cyan-300 bg-cyan-400/15 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.14)]'
                          : 'border-white/10 bg-black/35 text-white/75 hover:border-white/20 hover:text-white'
                        }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                        {category.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-[260px] rounded-[20px] border border-cyan-400/20 bg-black/60 backdrop-blur-xl p-4 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-cyan-300 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Temporal Filter
                </div>
                <span className="rounded-md bg-white/10 px-2 py-1 text-[9px] uppercase tracking-wider text-white/70">
                  {daysAgo === 0 ? 'Live' : `${daysAgo}d ago`}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={14}
                step={1}
                value={daysAgo}
                onChange={(e) => setDaysAgo(Number(e.target.value))}
                className="w-full accent-cyan-300"
              />

              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-white/50">
                <span>Past</span>
                <span className="text-cyan-300">Future (Live)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAnalyticsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="fixed inset-0 z-[2000] bg-black/35 backdrop-blur-sm flex items-start justify-center pt-[120px] px-4"
          >
            <div className="w-[min(1060px,92vw)] max-h-[78vh] overflow-y-auto rounded-[34px] border border-cyan-400/20 bg-black/80 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,240,255,0.08)]">
              <div className="sticky top-0 z-10 border-b border-white/10 bg-black/85 backdrop-blur-xl px-8 py-6 flex items-start justify-between">
                <div>
                  <div className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                    GEONEWS AI · {displayCategories.find((c) => c.value === activeCategory)?.label ?? activeCategory}
                  </div>
                  <h2 className="text-4xl font-semibold text-white tracking-tight">
                    {currentAnalytics.title}
                  </h2>
                </div>

                <button
                  onClick={() => setIsAnalyticsOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-cyan-400/15 pb-6">
                  <div className="text-cyan-300 text-sm font-semibold uppercase tracking-[0.22em]">
                    Regional Volatility · Signal Layers
                  </div>

                  <div className="ml-auto flex flex-wrap gap-3">
                    {['Live Conflict', 'Trade Routes', 'Climatic Anomalies'].map((pill) => (
                      <div
                        key={pill}
                        className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200"
                      >
                        {pill}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">
                  <div className="rounded-[26px] border border-cyan-400/15 bg-black/40 p-6">
                    <div className="mb-6 text-cyan-300 text-sm font-semibold uppercase tracking-[0.2em]">
                      Regional Volatility
                    </div>

                    <div className="space-y-6">
                      {currentAnalytics.volatility.map((item) => (
                        <div key={item.name}>
                          <div className="mb-2 flex items-center justify-between text-sm uppercase tracking-[0.18em]">
                            <span className="text-white/85">{item.name}</span>
                            <span className={`font-semibold ${getLevelTextClass(item.level)}`}>
                              {item.level}
                            </span>
                          </div>

                          <div className="h-4 rounded-full bg-white/5 overflow-hidden border border-white/5">
                            <div
                              className={`h-full rounded-full ${getLevelBarClass(item.level)}`}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="rounded-[26px] border border-cyan-400/15 bg-black/40 p-6">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="text-cyan-300 text-sm font-semibold uppercase tracking-[0.2em]">
                          Vector Risk Heatmap
                        </div>
                        <div className="rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
                          High-Risk Sectors
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {currentAnalytics.sectors.map((sector, index) => (
                          <div
                            key={sector}
                            className={`rounded-[20px] border p-5 ${index === 0
                                ? 'border-red-400/30 bg-red-400/10'
                                : 'border-yellow-300/25 bg-yellow-300/8'
                              }`}
                          >
                            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/85">
                              {sector}
                            </div>
                            <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${index === 0 ? 'bg-red-400' : 'bg-yellow-300'
                                  }`}
                                style={{ width: `${index === 0 ? 82 : index === 1 ? 58 : 44}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-[26px] border border-cyan-400/15 bg-black/40 p-6">
                        <div className="mb-6 text-cyan-300 text-sm font-semibold uppercase tracking-[0.2em]">
                          Neural Network Forecasts
                        </div>

                        <div className="rounded-[22px] border border-red-400/20 bg-red-400/10 p-6 h-full">
                          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/85 mb-4">
                            {currentAnalytics.forecastLeft.title}
                          </div>
                          <p className="text-white/85 leading-8 text-lg">
                            {currentAnalytics.forecastLeft.text}
                          </p>

                          <div className="mt-6 flex items-center justify-between">
                            <div className="rounded-full border border-red-400/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
                              Confidence: {currentAnalytics.forecastLeft.confidence}
                            </div>
                            <button className="rounded-full border border-cyan-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                              Focus Map
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[26px] border border-cyan-400/15 bg-black/40 p-6">
                        <div className="mb-6 text-cyan-300 text-sm font-semibold uppercase tracking-[0.2em]">
                          Neural Network Forecasts
                        </div>

                        <div className="rounded-[22px] border border-cyan-400/20 bg-cyan-400/8 p-6 h-full">
                          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/85 mb-4">
                            {currentAnalytics.forecastRight.title}
                          </div>
                          <p className="text-white/85 leading-8 text-lg">
                            {currentAnalytics.forecastRight.text}
                          </p>

                          <div className="mt-6 flex items-center justify-between">
                            <div className="rounded-full border border-cyan-400/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                              Confidence: {currentAnalytics.forecastRight.confidence}
                            </div>
                            <button className="rounded-full border border-cyan-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
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