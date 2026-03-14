import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Globe2, CloudRain, BarChart3, Cpu, X, TrendingUp, AlertTriangle, Loader2, RefreshCw, Layers } from 'lucide-react';
import { fetchRiskIndices, generateRegionalForecasts, type RiskIndex } from '../services/aiService';
import { NewsItem } from '../types';

interface StrategicDashboardProps {
  onClose: () => void;
  news?: NewsItem[]; // Passed in from App -> NavigationHub -> StrategicDashboard in a real scenario
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

type PillarId = 'geopolitics' | 'climate' | 'economy' | 'technology';

type PillarMeta = {
  id: PillarId;
  title: string;
  queryTitle: string;
  icon: React.ElementType;
  gradient: string;
  border: string;
  iconColor: string;
  barColor: string;
  analysis: string;
  volatilityData: { name: string; level: string; value: number }[];
  sectorsData: string[];
};

const PILLAR_META: Record<PillarId, PillarMeta> = {
  geopolitics: {
    id: 'geopolitics',
    title: 'Geopolitics',
    queryTitle: 'Geopolitics',
    icon: Globe2,
    gradient: 'from-[#00f0ff]/10 to-transparent',
    border: 'border-[#00f0ff]/20',
    iconColor: 'text-[#00f0ff]',
    barColor: 'bg-[#00f0ff]',
    analysis: "A conflict in the Middle East might disrupt Tech supply chains in Asia or the Economy of Europe. Local instability ripples outward.",
    volatilityData: [
      { name: 'Suez Corridor', level: 'Severe', value: 92 },
      { name: 'Taiwan Strait', level: 'High', value: 74 },
      { name: 'Panama Canal', level: 'Moderate', value: 53 }
    ],
    sectorsData: ['Suez Corridor', 'Taiwan Strait', 'Panama Canal']
  },
  climate: {
    id: 'climate',
    title: 'Climate',
    queryTitle: 'Climate',
    icon: CloudRain,
    gradient: 'from-emerald-500/10 to-transparent',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    barColor: 'bg-emerald-400',
    analysis: "Extreme weather anomalies in major agricultural and manufacturing hubs threaten the global flow of foundational resources.",
    volatilityData: [
      { name: 'Flood Zones', level: 'High', value: 81 },
      { name: 'Heat Stress', level: 'Severe', value: 90 },
      { name: 'Crop Volatility', level: 'Moderate', value: 59 }
    ],
    sectorsData: ['Flood Zones', 'Heat Stress', 'Crop Volatility']
  },
  economy: {
    id: 'economy',
    title: 'Economy',
    queryTitle: 'Economy',
    icon: BarChart3,
    gradient: 'from-yellow-400/10 to-transparent',
    border: 'border-yellow-400/20',
    iconColor: 'text-yellow-400',
    barColor: 'bg-yellow-400',
    analysis: "Shifts in global capital flows and currency pressure reshape the viability of international trade corridors.",
    volatilityData: [
      { name: 'Oil Market', level: 'High', value: 79 },
      { name: 'Container Freight', level: 'Moderate', value: 62 },
      { name: 'Currency Pressure', level: 'Moderate', value: 57 }
    ],
    sectorsData: ['Oil Market', 'Freight', 'Currencies']
  },
  technology: {
    id: 'technology',
    title: 'Tech',
    queryTitle: 'Technology',
    icon: Cpu,
    gradient: 'from-violet-500/10 to-transparent',
    border: 'border-violet-500/20',
    iconColor: 'text-violet-400',
    barColor: 'bg-violet-400',
    analysis: "Export restrictions and cyber vulnerabilities threaten the digital infrastructure that underpins global markets.",
    volatilityData: [
      { name: 'AI Compute', level: 'High', value: 77 },
      { name: 'Cyber Threat', level: 'High', value: 76 },
      { name: 'Chip Supply', level: 'Moderate', value: 60 }
    ],
    sectorsData: ['AI Compute', 'Cyber Threat', 'Chip Supply']
  },
};

// Static fallback used when risk_indices table is empty
const STATIC_FALLBACK: Record<string, Omit<RiskIndex, 'id' | 'created_at'>> = {
  Geopolitics: { category: 'Geopolitics', region: 'Middle East', risk_level: 92, label: 'Regional Volatility: Suez Corridor', level_label: 'Severe', forecast: 'Supply chain disruption is highly probable in the Red Sea corridor. Rerouting models indicate ~14 day delay on critical freight.', so_what: "If the Suez shuts down, your electronics get delayed by 2 weeks and shipping costs spike globally." },
  Climate: { category: 'Climate', region: 'Southeast Asia', risk_level: 90, label: 'Regional Volatility: Heat Stress', level_label: 'Severe', forecast: 'Water shortages in major fab regions could curb global chip output within 48h.', so_what: "A severe drought halfway around the world means fewer consumer goods and higher food prices at your local store." },
  Economy: { category: 'Economy', region: 'Global', risk_level: 62, label: 'Global Volatility: Container Freight', level_label: 'Moderate', forecast: 'Freight cost pressure may raise short-term logistics costs across major trade routes.', so_what: "Everything imported will cost more at the checkout counter." },
  Technology: { category: 'Technology', region: 'East Asia', risk_level: 77, label: 'System Volatility: AI Compute', level_label: 'High', forecast: 'Compute bottlenecks and export restrictions may intensify hardware competition. Elevated threat activity expected within 48h.', so_what: "AI development costs will spike, slowing new tech products." },
};

export default function StrategicDashboard({ onClose, news = [] }: StrategicDashboardProps) {
  const [activeTabId, setActiveTabId] = useState<PillarId>('geopolitics');
  const [riskData, setRiskData] = useState<RiskIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRiskData = async (regenerate = false) => {
    try {
      if (regenerate) {
        setIsRefreshing(true);
        const fresh = await generateRegionalForecasts();
        if (fresh.length) { setRiskData(fresh); return; }
      }
      const cached = await fetchRiskIndices();
      if (cached.length) {
        setRiskData(cached);
      } else if (!regenerate) {
        // Nothing cached yet - kick off generation in background
        generateRegionalForecasts().then((fresh) => {
          if (fresh.length) setRiskData(fresh);
        });
      }
    } catch (err) {
      console.error('[StrategicDashboard] loadRiskData error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadRiskData(); }, []);

  const activePillar = PILLAR_META[activeTabId];
  const Icon = activePillar.icon;

  const live = riskData.find(
    (r) => r.category.toLowerCase() === activePillar.id || r.category === activePillar.queryTitle
  );
  const fb = STATIC_FALLBACK[activePillar.queryTitle] ?? STATIC_FALLBACK['Geopolitics'];
  const riskSource = live ?? fb;

  const pillarNews = news.length > 0
    ? news.filter(n => n.category === activePillar.queryTitle).slice(0, 5) // Show top 5 globally
    : []; // Fallback empty state if news isn't provided

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col rounded-[24px] border border-cyan-400/20 bg-black/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,240,255,0.08)] overflow-hidden font-sans">
        {/* Header */}
        <div className="flex-none border-b border-white/10 bg-black/50 px-8 py-5 flex items-start justify-between">
          <div>
            <div className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Strategic AI Dashboard
              {isLoading && <Loader2 size={12} className="animate-spin ml-1" />}
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Global Impact Analytics
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadRiskData(true)}
              disabled={isRefreshing}
              title="Regenerate AI forecasts from latest news"
              className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex-none flex flex-wrap gap-0.5 border-b border-white/10 bg-black/30 px-8" aria-label="Analytics sectors">
          {(Object.values(PILLAR_META) as PillarMeta[]).map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                type="button"
                className={`px-6 py-4 text-xs font-mono font-semibold uppercase tracking-[0.15em] transition-colors border-b-2 -mb-[1px] ${
                  isActive
                    ? 'text-cyan-300 border-cyan-400 bg-white/5'
                    : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/[0.02]'
                }`}
              >
                {tab.title}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 max-w-7xl mx-auto h-full">

            {/* Left Column: Analytics Visualizations */}
            <div className={`rounded-3xl border bg-gradient-to-br ${activePillar.gradient} ${activePillar.border} p-6 flex flex-col gap-6 relative overflow-hidden group min-h-0`}>
              <div className={`absolute top-0 right-0 w-96 h-96 ${activePillar.iconColor} bg-current opacity-[0.03] blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 transition-opacity duration-700`} />

              {/* Title & Vector Summary */}
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-black/40 border ${activePillar.border} ${activePillar.iconColor} shadow-inner`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-wide">{activePillar.title} Vector</h3>
                </div>
                <p className="text-white/70 text-sm mt-2">{activePillar.analysis}</p>
              </div>

              {/* Volatility & Heatmap row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
                 {/* Regional Volatility */}
                 <div className="rounded-2xl border border-white/5 bg-black/40 p-5 min-h-[160px]">
                    <div className="mb-4 text-cyan-300 text-xs font-semibold uppercase tracking-[0.14em]">
                      Regional Volatility
                    </div>
                    <div className="space-y-4">
                      {activePillar.volatilityData.map((item) => (
                        <div key={item.name}>
                          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.1em]">
                            <span className="text-white/80">{item.name}</span>
                            <span className={`font-semibold ${getLevelTextClass(item.level)}`}>
                              {item.level}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 1 }}
                              className={`h-full rounded-full ${getLevelBarClass(item.level)}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vector Risk Heatmap */}
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-5 min-h-[160px] flex flex-col">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.14em]">
                          Vector Risk Heatmap
                        </span>
                        <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[9px] font-mono font-semibold uppercase tracking-[0.12em] text-red-200">
                          High-Risk Sectors
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 flex-1">
                        {activePillar.sectorsData.map((sector, index) => (
                          <div
                            key={sector}
                            className={`rounded-xl border p-2.5 flex items-center justify-between ${
                              index === 0 ? 'border-red-400/30 bg-red-400/10' : 'border-yellow-300/25 bg-yellow-300/8'
                            }`}
                          >
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">
                              {sector}
                            </div>
                            <div className="w-1/2 h-1.5 rounded-full bg-white/10 overflow-hidden ml-4">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${index === 0 ? 82 : index === 1 ? 58 : 44}%` }}
                                transition={{ duration: 1.2 }}
                                className={`h-full rounded-full ${index === 0 ? 'bg-red-400' : 'bg-yellow-300'}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
              </div>

              {/* Neural Network Forecast & So What */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/5 space-y-5 relative z-10 shadow-inner mt-auto">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className={activePillar.iconColor} />
                  <div className="text-xs font-bold uppercase tracking-widest text-white/80">Global Neural Network Forecast (48h)</div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-3 text-xs uppercase tracking-wider">
                    <span className="text-white/70 font-bold">{riskSource.label}</span>
                    <span className={`font-bold px-2 py-1 rounded-md bg-black/50 border border-white/10 tracking-widest ${
                      riskSource.level_label === 'Severe' ? 'text-red-400' :
                      riskSource.level_label === 'High' ? 'text-orange-400' : 'text-yellow-400'
                    }`}>{riskSource.level_label}</span>
                  </div>
                  <div className="h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${riskSource.risk_level}%` }}
                      transition={{ duration: 1.5, delay: 0.1, ease: 'easeOut' }}
                      className={`h-full ${activePillar.barColor} relative`}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                  </div>
                </div>

                <p className={`text-white/80 text-sm leading-relaxed border-l-2 ${activePillar.border} pl-4 py-1`}>
                  {riskSource.forecast}
                </p>

                {/* So What section */}
                <div className={`p-4 rounded-xl bg-gradient-to-r ${activePillar.gradient} border ${activePillar.border} flex gap-4 items-start`}>
                  <div className={`p-2 rounded-lg bg-black/40 border ${activePillar.border} ${activePillar.iconColor} shadow-inner`}>
                    <AlertTriangle size={16} className="flex-shrink-0" />
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${activePillar.iconColor} mb-1`}>Global Implication - The "So What?"</div>
                    <p className="text-white text-sm font-medium leading-snug drop-shadow-md">{riskSource.so_what}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: News Feed Context */}
            <div className="rounded-3xl border border-white/5 bg-black/40 p-6 flex flex-col min-h-0">
               <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                 <div className="flex items-center gap-2">
                   <Layers size={18} className="text-white/50" />
                   <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Global Intelligence</h3>
                 </div>
                 <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase font-mono text-white/50 border border-white/10">
                   LIVE
                 </span>
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                 {pillarNews.length > 0 ? (
                   pillarNews.map((item, idx) => (
                     <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/30 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-300/80">{item.source}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            item.importance === 5 ? 'bg-red-400/20 text-red-400' :
                            item.importance === 4 ? 'bg-orange-400/20 text-orange-400' :
                            'bg-emerald-400/20 text-emerald-400'
                          }`}>
                            L{item.importance} Event
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white/90 leading-snug mb-2 group-hover:text-white transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">
                           {item.summary}
                        </p>
                     </div>
                   ))
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
                      <Globe2 size={32} className="text-white/20 mb-4" />
                      <p className="text-sm text-white/50 mb-1">No live signals detected.</p>
                      <p className="text-xs text-white/30">Connect global feed to view correlated events.</p>
                   </div>
                 )}
               </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
