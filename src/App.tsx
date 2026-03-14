import { useState, useEffect, useCallback } from 'react';
import Map from './components/Map';
import NavigationHub from './components/NavigationHub';
import CommandAssistant from './components/CommandAssistant';
import { NewsCategory, NewsItem, TrendAnalysis, UserInterest } from './types';
import { fetchNews, analyzeTrends, analyzeImage, deepResearch } from './services/newsService';
import { getCountryCoordinates } from './services/countryCoordinates';
import { Loader2, X, AlertCircle, Globe, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('Geopolitics');
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Energy', 'Shipping']);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bounds, setBounds] = useState<any>(null);
  const [zoom, setZoom] = useState(3);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [researchReport, setResearchReport] = useState<string | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSentiment, setShowSentiment] = useState(false);
  const [daysAgo, setDaysAgo] = useState(0);
  const [applyCounter, setApplyCounter] = useState(0);
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number } | null>(null);

  const [interests, setInterests] = useState<UserInterest[]>([
    {
      id: '1',
      name: 'Rotterdam Port',
      type: 'Supply Chain',
      lat: 51.9225,
      lng: 4.47917,
      radius: 50
    },
    {
      id: '2',
      name: 'Silicon Valley',
      type: 'Investment',
      lat: 37.4419,
      lng: -122.143,
      radius: 100
    },
    {
      id: 'r1',
      name: 'Trans-Atlantic Shipping Route',
      type: 'Travel Route',
      lat: 0,
      lng: 0,
      radius: 0,
      coords: [
        [51.9225, 4.47917],
        [45.0, -30.0],
        [40.7128, -74.006]
      ]
    }
  ]);

  useEffect(() => {
    const loadTrends = async () => {
      setIsAnalyzing(true);
      const data = await analyzeTrends();
      setTrends(data);
      setIsAnalyzing(false);
    };

    loadTrends();
  }, []);

  const loadNews = useCallback(async () => {
    if (!bounds || applyCounter === 0) return;

    setIsLoading(true);

    const data = await fetchNews(
      activeCategory,
      {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      },
      zoom,
      daysAgo,
      interests
    );

    setNews(data);
    setIsLoading(false);
  }, [activeCategory, bounds, zoom, daysAgo, interests, applyCounter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNews();
    }, 500);

    return () => clearTimeout(timer);
  }, [loadNews]);

  const handleBoundsChange = useCallback((newBounds: any, newZoom: number) => {
    setBounds(newBounds);
    setZoom(newZoom);
  }, []);

  const handleAnalyzeImage = async (file: File) => {
    setIsAnalyzingImage(true);
    setImageAnalysis(null);

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await analyzeImage(base64);
      setImageAnalysis(result);
      setIsAnalyzingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleAddInterest = (interest: UserInterest) => {
    if (!bounds) return;

    const center = bounds.getCenter();
    const centerLat = Number(center.lat ?? 0);
    const centerLng = Number(center.lng ?? 0);

    const routeCoords: [number, number][] = [
      [centerLat, centerLng],
      [centerLat + 5, centerLng + 10],
      [centerLat + 10, centerLng + 20]
    ];

    const newInterest: UserInterest = {
      ...interest,
      lat: centerLat,
      lng: centerLng,
      coords: interest.type === 'Travel Route' ? routeCoords : undefined
    };

    setInterests((prev) => [...prev, newInterest]);
  };

  const handleRemoveInterest = (id: string) => {
    setInterests((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDeepResearch = async () => {
    if (!selectedNews) return;

    setIsDeepResearching(true);
    const report = await deepResearch(selectedNews);
    setResearchReport(report);
    setIsDeepResearching(false);
  };

  const closeNewsModal = useCallback(() => {
    setSelectedNews(null);
    setResearchReport(null);
  }, []);

  const handleMarkerClick = useCallback((item: NewsItem) => {
    setSelectedNews(item);
    setResearchReport(null);
    setIsGlitching(true);

    setTimeout(() => setIsGlitching(false), 320);
  }, []);

  const handleToggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }, []);

  const handleCenterOnCountry = useCallback((countryName: string) => {
    const coords = getCountryCoordinates(countryName);
    if (coords) setCenterOn({ lat: coords.lat, lng: coords.lng });
  }, []);

  const handleCenterComplete = useCallback(() => {
    setCenterOn(null);
  }, []);

  console.log('APP NEWS:', news);

  return (
    <div className={`relative h-full w-full bg-black font-sans text-white overflow-hidden ${isGlitching ? 'glitch-shake' : ''}`}>
      <NavigationHub
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        isAnalyticsOpen={isAnalyticsOpen}
        setIsAnalyticsOpen={setIsAnalyticsOpen}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        selectedInterests={selectedInterests}
        onToggleInterest={handleToggleInterest}
        daysAgo={daysAgo}
        setDaysAgo={setDaysAgo}
        onApplyFilters={() => setApplyCounter((prev) => prev + 1)}
      />

      <main className="absolute inset-0 z-[1]">
        <Map
          news={news}
          interests={interests}
          onBoundsChange={handleBoundsChange}
          onMarkerClick={handleMarkerClick}
          showHeatmap={showHeatmap}
          showSentiment={showSentiment}
          centerOn={centerOn}
          onCenterComplete={handleCenterComplete}
        />
      </main>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-8 right-8 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 z-[2000] shadow-xl"
          >
            <Loader2 size={16} className="animate-spin text-emerald-500" />
            <span className="text-xs font-medium text-emerald-100">Syncing Local Data...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0, x: 500 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 500 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-[calc(100vh-32px)] w-[400px] bg-black/70 backdrop-blur-2xl border-l border-[#00f0ff]/20 z-[3000] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-b from-[#00f0ff]/10 to-transparent">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_10px_#00f0ff]" />
                  <span className="text-[10px] text-[#00f0ff] font-mono font-bold tracking-widest uppercase">
                    Target Lock Acquired
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-white/10 text-gray-300 text-[9px] font-bold rounded uppercase tracking-wider">
                    {selectedNews.category}
                  </span>

                  <span
                    className={cn(
                      'px-2 py-1 text-[9px] font-bold rounded uppercase tracking-wider',
                      selectedNews.sentiment === 'Negative' || selectedNews.sentiment === 'Panic'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : selectedNews.sentiment === 'Positive' || selectedNews.sentiment === 'Celebratory'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20'
                    )}
                  >
                    {selectedNews.sentiment} Signal
                  </span>
                </div>
              </div>

              <button
                onClick={closeNewsModal}
                className="text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold leading-tight tracking-tight mb-3 text-white">
                  {selectedNews.title}
                </h2>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {selectedNews.summary}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-bold text-[#00f0ff] uppercase tracking-widest">
                  <AlertCircle size={12} />
                  The "So What?" (TL;DR)
                </div>
                <p className="text-xs text-[#00f0ff] leading-relaxed font-medium grayscale opacity-80">
                  {selectedNews.soWhat}
                </p>
              </div>

              {selectedNews.personalizedImpact && (
                <div className="p-4 bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-violet-400 uppercase tracking-widest">
                    <Globe size={12} />
                    Connected Causality Detected
                  </div>
                  <p className="text-xs text-violet-100/70 leading-relaxed font-medium">
                    {selectedNews.personalizedImpact}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                {!researchReport && !isDeepResearching ? (
                  <button
                    onClick={handleDeepResearch}
                    className="w-full relative group bg-black/40 border border-[#00f0ff]/30 hover:border-[#00f0ff]/70 rounded-xl p-4 transition-all duration-300 flex items-center justify-between overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/0 via-[#00f0ff]/10 to-[#00f0ff]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-white flex items-center gap-2 text-xs">
                        <Zap size={14} className="text-[#00f0ff]" />
                        Deep Engine Scan
                      </span>
                      <span className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-mono">
                        Ping offline Ollama core
                      </span>
                    </div>
                    <div className="bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50 text-[9px] font-bold px-3 py-1.5 rounded-lg group-hover:bg-[#00f0ff] group-hover:text-black transition-colors uppercase tracking-widest">
                      Execute
                    </div>
                  </button>
                ) : isDeepResearching ? (
                  <div className="w-full bg-black/40 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-[#00f0ff]" size={24} />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest">
                        Local LLM Analyzing...
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-mono">
                        Generating offline causality report
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-black/80 border border-[#00f0ff]/40 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                    <div className="bg-[#00f0ff]/10 border-b border-[#00f0ff]/30 px-4 py-3 flex items-center gap-2">
                      <Zap size={12} className="text-[#00f0ff]" />
                      <span className="text-[9px] font-bold text-[#00f0ff] uppercase tracking-widest">
                        Ollama Intelligence Report
                      </span>
                    </div>
                    <div className="p-5 prose prose-invert prose-emerald prose-xs max-w-none text-gray-300">
                      <Markdown>{researchReport}</Markdown>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 pb-2 flex justify-between items-center border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold font-mono">
                    Source Verified
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5">
                    {selectedNews.source}
                  </span>
                </div>

                <a
                  href={selectedNews.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 border border-white/20 hover:bg-white text-gray-300 hover:text-black px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                >
                  View Original
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-gray-400 z-[10] pointer-events-none">
        {zoom > 10 ? 'Local View' : zoom > 5 ? 'Regional View' : 'Global View'} (Zoom: {zoom})
      </div>

      <CommandAssistant onCenterOnCountry={handleCenterOnCountry} />

      <div className="scanline-overlay fixed inset-0 z-[500]" />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
