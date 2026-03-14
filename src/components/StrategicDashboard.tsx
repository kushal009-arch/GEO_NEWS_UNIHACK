import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Globe2, CloudRain, BarChart3, Cpu, X, TrendingUp, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { fetchRiskIndices, generateRegionalForecasts, type RiskIndex } from '../services/aiService';

interface StrategicDashboardProps {
  onClose: () => void;
}

type PillarMeta = {
  id: string;
  title: string;
  icon: React.ElementType;
  gradient: string;
  border: string;
  iconColor: string;
  barColor: string;
  analysis: string;
};

const PILLAR_META: PillarMeta[] = [
  {
    id: 'geopolitics',
    title: 'Geopolitics',
    icon: Globe2,
    gradient: 'from-[#00f0ff]/10 to-transparent',
    border: 'border-[#00f0ff]/20',
    iconColor: 'text-[#00f0ff]',
    barColor: 'bg-[#00f0ff]',
    analysis: "A conflict in the Middle East might disrupt Tech supply chains in Asia or the Economy of Europe. Local instability ripples outward.",
  },
  {
    id: 'climate',
    title: 'Climate',
    icon: CloudRain,
    gradient: 'from-emerald-500/10 to-transparent',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    barColor: 'bg-emerald-400',
    analysis: "Extreme weather anomalies in major agricultural and manufacturing hubs threaten the global flow of foundational resources.",
  },
  {
    id: 'economy',
    title: 'Economy',
    icon: BarChart3,
    gradient: 'from-yellow-400/10 to-transparent',
    border: 'border-yellow-400/20',
    iconColor: 'text-yellow-400',
    barColor: 'bg-yellow-400',
    analysis: "Shifts in global capital flows and currency pressure reshape the viability of international trade corridors.",
  },
  {
    id: 'technology',
    title: 'Tech',
    icon: Cpu,
    gradient: 'from-violet-500/10 to-transparent',
    border: 'border-violet-500/20',
    iconColor: 'text-violet-400',
    barColor: 'bg-violet-400',
    analysis: "Export restrictions and cyber vulnerabilities threaten the digital infrastructure that underpins global markets.",
  },
];

// Static fallback used when risk_indices table is empty
const STATIC_FALLBACK: Record<string, Omit<RiskIndex, 'id' | 'created_at'>> = {
  Geopolitics: { category: 'Geopolitics', region: 'Middle East', risk_level: 92, label: 'Regional Volatility: Suez Corridor', level_label: 'Severe', forecast: 'Supply chain disruption is highly probable in the Red Sea corridor. Rerouting models indicate ~14 day delay on critical freight.', so_what: "If the Suez shuts down, your electronics get delayed by 2 weeks and shipping costs spike globally." },
  Climate: { category: 'Climate', region: 'Southeast Asia', risk_level: 90, label: 'Regional Volatility: Heat Stress', level_label: 'Severe', forecast: 'Water shortages in major fab regions could curb global chip output within 48h.', so_what: "A severe drought halfway around the world means fewer consumer goods and higher food prices at your local store." },
  Economy: { category: 'Economy', region: 'Global', risk_level: 62, label: 'Global Volatility: Container Freight', level_label: 'Moderate', forecast: 'Freight cost pressure may raise short-term logistics costs across major trade routes.', so_what: "Everything imported will cost more at the checkout counter." },
  Technology: { category: 'Technology', region: 'East Asia', risk_level: 77, label: 'System Volatility: AI Compute', level_label: 'High', forecast: 'Compute bottlenecks and export restrictions may intensify hardware competition. Elevated threat activity expected within 48h.', so_what: "AI development costs will spike, slowing new tech products." },
};
export default function StrategicDashboard({ onClose }: StrategicDashboardProps) {
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

  // Merge live risk data with static pillar metadata, fall back to STATIC_FALLBACK when empty
  const pillars = PILLAR_META.map((meta) => {
    const live = riskData.find(
      (r) => r.category.toLowerCase() === meta.id || r.category === meta.title
    );
    const fb = STATIC_FALLBACK[meta.title] ?? STATIC_FALLBACK['Geopolitics'];
    const src = live ?? fb;
    return {
      ...meta,
      volatility: { label: src.label, level: src.level_label, value: src.risk_level },
      forecast: src.forecast,
      soWhat: src.so_what,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col rounded-[34px] border border-cyan-400/20 bg-black/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,240,255,0.08)] overflow-hidden">

        <div className="flex-none border-b border-white/10 bg-black/50 px-8 py-6 flex items-start justify-between">
          <div>
            <div className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Strategic AI Dashboard
              {isLoading && <Loader2 size={12} className="animate-spin ml-1" />}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Global Impact Analytics
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadRiskData(true)}
              disabled={isRefreshing}
              title="Regenerate AI forecasts from latest news"
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.id} className={`rounded-3xl border bg-gradient-to-br ${pillar.gradient} ${pillar.border} p-6 xl:p-8 flex flex-col gap-6 relative overflow-hidden group`}>

                  <div className={`absolute top-0 right-0 w-64 h-64 ${pillar.iconColor} bg-current opacity-[0.03] blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 group-hover:opacity-[0.08] transition-opacity duration-700`} />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3.5 rounded-2xl bg-black/40 border ${pillar.border} ${pillar.iconColor} shadow-inner`}>
                      <Icon size={28} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide">{pillar.title}</h3>
                  </div>

                  <div className="relative z-10 space-y-6 flex-1 flex flex-col">
                    <div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${pillar.iconColor} mb-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]`}>Global Analysis Vector</div>
                      <p className="text-white/80 text-sm md:text-base leading-relaxed">{pillar.analysis}</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-black/50 border border-white/5 space-y-5 flex-1 shadow-inner flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className={pillar.iconColor} />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">Neural Network Forecast (48h)</div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-3 text-xs uppercase tracking-wider">
                          <span className="text-white/70 font-bold">{pillar.volatility.label}</span>
                          <span className={`font-bold px-2 py-1 rounded-md bg-black/50 border border-white/10 tracking-widest ${
                            pillar.volatility.level === 'Severe' ? 'text-red-400' :
                            pillar.volatility.level === 'High' ? 'text-orange-400' : 'text-yellow-400'
                          }`}>{pillar.volatility.level}</span>
                        </div>
                        <div className="h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pillar.volatility.value}%` }}
                            transition={{ duration: 1.5, delay: 0.1, ease: 'easeOut' }}
                            className={`h-full ${pillar.barColor} relative`}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </motion.div>
                        </div>
                      </div>

                      <p className={`text-white/80 text-sm leading-relaxed border-l-2 ${pillar.border} pl-4 py-1`}>
                        {pillar.forecast}
                      </p>
                    </div>

                    <div className={`p-5 rounded-xl bg-gradient-to-r ${pillar.gradient} border ${pillar.border} flex gap-4 items-start`}>
                      <div className={`p-2 rounded-lg bg-black/40 border ${pillar.border} ${pillar.iconColor} shadow-inner`}>
                        <AlertTriangle size={18} className="flex-shrink-0" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-bold uppercase tracking-widest ${pillar.iconColor} mb-1.5`}>The "So What?"</div>
                        <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md">{pillar.soWhat}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
