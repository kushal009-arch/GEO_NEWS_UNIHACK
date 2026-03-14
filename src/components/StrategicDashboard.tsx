import { motion } from 'motion/react';
import { Globe2, CloudRain, BarChart3, Cpu, X, TrendingUp, AlertTriangle } from 'lucide-react';

interface StrategicDashboardProps {
  onClose: () => void;
}

const pillars = [
  {
    id: 'geopolitics',
    title: 'Geopolitics',
    icon: Globe2,
    gradient: 'from-[#00f0ff]/10 to-transparent',
    border: 'border-[#00f0ff]/20',
    iconColor: 'text-[#00f0ff]',
    barColor: 'bg-[#00f0ff]',
    analysis: "A conflict in the Middle East might disrupt Tech supply chains in Asia or the Economy of Europe. Local instability ripples outward.",
    volatility: { label: "Regional Volatility: Suez Corridor", level: "Severe", value: 92 },
    forecast: "Supply chain disruption is highly probable in the Red Sea corridor within 48 hours. Rerouting models indicate ~14 day delay on critical freight.",
    soWhat: "If the Suez shuts down, your electronics get delayed by 2 weeks and shipping costs spike globally."
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
    volatility: { label: "Regional Volatility: Heat Stress", level: "Severe", value: 90 },
    forecast: "Water shortages in major fab regions could curb global chip output. Extreme weather concentration is likely to disrupt regional infrastructure within 48h.",
    soWhat: "A severe drought halfway around the world means fewer consumer goods and higher food prices at your local store."
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
    volatility: { label: "Global Volatility: Container Freight", level: "Moderate", value: 62 },
    forecast: "Freight cost pressure and energy instability may raise short-term logistics costs across major trade routes over the next 48 hours.",
    soWhat: "Everything imported will cost noticeably more at the checkout counter as shipping companies pass on their elevated costs."
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
    volatility: { label: "System Volatility: AI Compute", level: "High", value: 77 },
    forecast: "Compute bottlenecks and export restrictions may intensify hardware competition across major AI ecosystems. Elevated threat activity expected within 48h.",
    soWhat: "AI and software development costs will skyrocket, slowing down the release of new technologies and smart consumer products."
  }
];

export default function StrategicDashboard({ onClose }: StrategicDashboardProps) {
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
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Global Impact Analytics
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
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
                              transition={{ duration: 1.5, delay: 0.1, ease: "easeOut" }}
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
