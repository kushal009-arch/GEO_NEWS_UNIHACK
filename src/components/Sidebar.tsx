import { useState } from 'react';
import { 
  Newspaper, 
  TrendingUp, 
  Filter, 
  Globe, 
  Map as MapIcon, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  X
} from 'lucide-react';
import { NewsCategory, NewsItem, TrendAnalysis, UserInterest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
  trends: TrendAnalysis[];
  isAnalyzing: boolean;
  onAnalyzeImage: (file: File) => void;
  imageAnalysis: string | null;
  isAnalyzingImage: boolean;
  interests: UserInterest[];
  onAddInterest: (interest: UserInterest) => void;
  onRemoveInterest: (id: string) => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  showSentiment: boolean;
  setShowSentiment: (show: boolean) => void;
}

const categories: NewsCategory[] = [
  'Just In',
  'For You',
  'Geopolitics',
  'Climate',
  'Business',
  'Technology'
];

export default function Sidebar({ 
  activeCategory, 
  onCategoryChange, 
  trends, 
  isAnalyzing,
  onAnalyzeImage,
  imageAnalysis,
  isAnalyzingImage,
  interests,
  onAddInterest,
  onRemoveInterest,
  showHeatmap,
  setShowHeatmap,
  showSentiment,
  setShowSentiment
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'trends' | 'image' | 'personal'>('news');
  const [newInterest, setNewInterest] = useState({ name: '', type: 'Supply Chain' as any });

  return (
    <div className={cn(
      "fixed top-0 left-0 h-full bg-black/90 backdrop-blur-md border-r border-white/10 transition-all duration-300 z-[1000] flex flex-col",
      isOpen ? "w-80" : "w-16"
    )}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
          <Globe className="text-white" size={20} />
        </div>
        {isOpen && (
          <h1 className="text-xl font-semibold text-white tracking-[0.1em] uppercase font-sans text-neon">
            GeoNews AI
          </h1>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('news')}
          className={cn(
            "flex-1 py-2 rounded-md flex items-center justify-center transition-colors",
            activeTab === 'news' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          )}
          title="News"
        >
          <Newspaper size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('trends')}
          className={cn(
            "flex-1 py-2 rounded-md flex items-center justify-center transition-colors",
            activeTab === 'trends' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          )}
          title="Trends"
        >
          <TrendingUp size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('personal')}
          className={cn(
            "flex-1 py-2 rounded-md flex items-center justify-center transition-colors",
            activeTab === 'personal' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          )}
          title="Personal Intelligence"
        >
          <Search size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('image')}
          className={cn(
            "flex-1 py-2 rounded-md flex items-center justify-center transition-colors",
            activeTab === 'image' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          )}
          title="Image Analysis"
        >
          <ImageIcon size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.1em] mb-4 flex items-center gap-2 font-sans">
                    <Filter size={12} /> Categories
                  </h2>
                  <div className="grid grid-cols-1 gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={cn(
                          "text-left px-3 py-2 rounded-lg text-sm transition-all",
                          activeCategory === cat 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="pt-4 border-t border-white/10">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.1em] mb-4 font-sans">
                    Intelligence Layers
                  </h2>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Sentiment Mood</span>
                      <input 
                        type="checkbox" 
                        checked={showSentiment} 
                        onChange={(e) => setShowSentiment(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Information Vacuum</span>
                      <input 
                        type="checkbox" 
                        checked={showHeatmap} 
                        onChange={(e) => setShowHeatmap(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500"
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
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.1em] font-sans">
                    Global Trends
                  </h2>
                  {isAnalyzing && <Loader2 size={14} className="animate-spin text-emerald-500" />}
                </div>
                
                {trends.map((trend, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">Trend</span>
                      <span className="text-[10px] text-gray-500">{(trend.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>
                    <p className="text-sm text-white font-medium">{trend.trend}</p>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[11px] text-gray-400 italic">Prediction: {trend.prediction}</p>
                      <p className="text-[11px] text-gray-400 mt-1">Impact: {trend.impact}</p>
                    </div>
                  </div>
                ))}
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
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.1em] font-sans">
                  My Interests
                </h2>
                
                <div className="space-y-2">
                  {interests.map((interest) => (
                    <div key={interest.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-white">{interest.name}</p>
                        <p className="text-[10px] text-gray-500">{interest.type}</p>
                      </div>
                      <button 
                        onClick={() => onRemoveInterest(interest.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <p className="text-xs text-gray-400 font-sans">
                    Add new interest at current map center
                  </p>
                  <input 
                    type="text" 
                    placeholder="Interest name (e.g. Rotterdam Port)" 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={newInterest.name}
                    onChange={(e) => setNewInterest({ ...newInterest, name: e.target.value })}
                  />
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={newInterest.type}
                    onChange={(e) => setNewInterest({ ...newInterest, type: e.target.value as any })}
                  >
                    <option value="Supply Chain">Supply Chain</option>
                    <option value="Travel Route">Travel Route</option>
                    <option value="Family">Family</option>
                    <option value="Investment">Investment</option>
                  </select>
                  <button 
                    onClick={() => {
                      if (newInterest.name) {
                        onAddInterest({
                          id: Math.random().toString(36).substr(2, 9),
                          name: newInterest.name,
                          type: newInterest.type,
                          lat: 0, // Will be set in App.tsx
                          lng: 0,
                          radius: 50
                        });
                        setNewInterest({ name: '', type: 'Supply Chain' });
                      }
                    }}
                    className="w-full bg-emerald-500 text-white rounded-lg py-2 text-sm font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Add Interest
                  </button>
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
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.1em] font-sans">
                  Image Analysis
                </h2>
                <div 
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer group"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <ImageIcon className="mx-auto mb-2 text-gray-500 group-hover:text-emerald-500" size={32} />
                  <p className="text-xs text-gray-400">Click to upload news image for analysis</p>
                  <input 
                    id="image-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onAnalyzeImage(file);
                    }}
                  />
                </div>

                {isAnalyzingImage && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="animate-spin text-emerald-500" />
                  </div>
                )}

                {imageAnalysis && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm">
                      <Markdown>{imageAnalysis}</Markdown>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live AI Monitoring Active
          </div>
        </div>
      )}
    </div>
  );
}
