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
          <StrategicDashboard onClose={() => setIsAnalyticsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
