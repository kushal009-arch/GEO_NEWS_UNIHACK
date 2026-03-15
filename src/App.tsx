import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Map from './components/Map';
import NavigationHub from './components/NavigationHub';
import CommandAssistant from './components/CommandAssistant';
import HeadlinesTicker from './components/HeadlinesTicker';
import { NewsCategory, NewsItem, TrendAnalysis, UserInterest } from './types';
import { fetchNews, fetchAllNews, analyzeTrends, analyzeImage, deepResearch, syncLatestNews, isSyncNeeded, markSyncDone, invalidateNewsCache, getLocationLabel } from './services/newsService';
import { getCountryCoordinates } from './services/countryCoordinates';
import { Loader2, X, AlertCircle, Globe, Zap, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('Just In');
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Energy', 'Shipping']);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bounds, setBounds] = useState<any>(null);
  const [zoom, setZoom] = useState(3); // Start zoomed to see Asia-Pacific
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [researchReport, setResearchReport] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);


  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSentiment, setShowSentiment] = useState(false);
  const [daysAgo, setDaysAgo] = useState(1);
  // Start at 1 so news loads automatically as soon as the map reports its bounds
  const [applyCounter, setApplyCounter] = useState(1);
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

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

  // On mount: load all news globally so the globe is populated with all categories
  useEffect(() => {
    fetchAllNews(interests).then((data) => setNews(data)).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNews = useCallback(async () => {
    if (applyCounter === 0) return;

    // Use world-wide bounds when map hasn't reported yet (initial render)
    const effectiveBounds = bounds ?? {
      getNorth: () => 85,
      getSouth: () => -85,
      getEast: () => 180,
      getWest: () => -180,
    };

    setIsLoading(true);
    try {
      const data = await fetchNews(
        'Just In', // fetch all categories; client filters by activeCategory
        {
          north: effectiveBounds.getNorth(),
          south: effectiveBounds.getSouth(),
          east: effectiveBounds.getEast(),
          west: effectiveBounds.getWest()
        },
        zoom,
        daysAgo,
        interests
      );
      setNews(data);
    } finally {
      setIsLoading(false);
    }
  }, [bounds, zoom, daysAgo, interests, applyCounter]);

  // Client-side category + bounds filter - instant, no re-fetch
  // When zoomed in, only show news within the visible map area
  const displayedNews = useMemo(() => {
    let filtered = news;
    if (activeCategory !== 'Just In' && activeCategory !== 'For You') {
      filtered = filtered.filter((item) => item.category === activeCategory);
    }
    // Apply bounds filter when zoomed in (zoom >= 3) for regional focus
    if (bounds && zoom >= 3) {
      try {
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
        if (Number.isFinite(north) && Number.isFinite(south)) {
          // Add padding so markers near edges still appear
          const latPad = (north - south) * 0.15;
          const lngPad = (east - west) * 0.15;
          filtered = filtered.filter((item) =>
            item.lat >= south - latPad && item.lat <= north + latPad &&
            item.lng >= west - lngPad && item.lng <= east + lngPad
          );
        }
      } catch { /* bounds proxy may not be ready yet */ }
    }

    // Sort by impact (highest first), then alphabetically by title
    filtered = [...filtered].sort((a, b) => {
      const impDiff = (b.importance ?? 0) - (a.importance ?? 0);
      if (impDiff !== 0) return impDiff;
      return (a.title ?? '').localeCompare(b.title ?? '');
    });

    // Cap at 25 events for the visible region
    if (filtered.length > 25) {
      filtered = filtered.slice(0, 25);
    }

    return filtered;
  }, [news, activeCategory, bounds, zoom]);

  // On startup: load news from the database (no live sync).
  // Live sync only happens when the user explicitly sets the temporal filter to
  // "Live" and presses "Set Filters".
  useEffect(() => {
    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload news 100ms after user stops scrolling / changing view (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadNews();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadNews]);

  const lastBoundsRef = useRef<{ zoom: number; lat: number; lng: number } | null>(null);
  const handleBoundsChange = useCallback((newBounds: any, newZoom: number) => {
    const newC = newBounds?.getCenter?.();
    const last = lastBoundsRef.current;
    const zoomSame = last !== null && last.zoom === newZoom;
    const centerSame =
      last !== null &&
      newC &&
      Math.abs(last.lat - newC.lat) < 0.001 &&
      Math.abs(last.lng - newC.lng) < 0.001;
    if (zoomSame && centerSame) return;
    lastBoundsRef.current = newC ? { zoom: newZoom, lat: newC.lat, lng: newC.lng } : null;
    setBounds(newBounds);
    // Explicitly clamp parent state to project limits
    setZoom(Math.max(1, Math.min(10, newZoom)));
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
    setLocationLabel(null);
  }, []);

  const handleMarkerClick = useCallback((item: NewsItem) => {
    setSelectedNews(item);
    setResearchReport(null);
    setLocationLabel(null);
    // Always reverse-geocode to get a real place name (skip only if label is already meaningful)
    const serverLabel = item.locationLabel;
    if (serverLabel && serverLabel !== 'ROW') {
      setLocationLabel(serverLabel);
    } else {
      getLocationLabel(item.lat, item.lng).then(setLocationLabel).catch(() => {});
    }
  }, []);

  const handleToggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }, []);

  /**
   * Navigates the globe to be centered at the given country, then zooms in to country level.
   * Uses country centroid from countryCoordinates; returns false if country is not in the lookup.
   */
  const navigateToCountry = useCallback((countryName: string, zoomLevel?: number): boolean => {
    const coords = getCountryCoordinates(countryName);
    if (!coords) return false;
    const targetZoom = zoomLevel != null ? zoomLevel : 6.5;
    setCenterOn({ lat: coords.lat, lng: coords.lng, zoom: targetZoom });
    return true;
  }, []);

  const handleCenterOnCountry = useCallback((countryName: string) => {
    navigateToCountry(countryName);
  }, [navigateToCountry]);

  const handleCenterComplete = useCallback(() => {
    setCenterOn(null);
  }, []);

  // Derive a region label from the current map center when zoomed in
  const regionLabel = useMemo(() => {
    if (!bounds || zoom < 3) return null;
    const center = bounds.getCenter?.();
    if (!center) return null;
    const { lat, lng } = center;
    // Asia-Pacific subregions
    if (lat > 20 && lat < 45 && lng > 100 && lng < 145) return 'East Asia';
    if (lat > -10 && lat < 20 && lng > 95 && lng < 140) return 'Southeast Asia';
    if (lat > 5 && lat < 40 && lng > 65 && lng < 100) return 'South Asia';
    if (lat < -10 && lat > -45 && lng > 110 && lng < 160) return 'Australia';
    if (lat < -30 && lng > 165 && lng < 180) return 'New Zealand';
    // Americas
    if (lat > 25 && lat < 50 && lng > -130 && lng < -60) return 'North America';
    if (lat > -5 && lat < 25 && lng > -120 && lng < -60) return 'Central America';
    if (lat < -5 && lat > -55 && lng > -80 && lng < -35) return 'South America';
    // Europe
    if (lat > 45 && lat < 72 && lng > -15 && lng < 30) return 'Northern Europe';
    if (lat > 35 && lat < 48 && lng > -15 && lng < 30) return 'Southern Europe';
    if (lat > 45 && lat < 60 && lng > 30 && lng < 60) return 'Eastern Europe';
    if (lat > 35 && lat < 72 && lng > -15 && lng < 40) return 'Europe';
    // Middle East & Africa
    if (lat > 10 && lat < 40 && lng > 25 && lng < 65) return 'Middle East';
    if (lat < 10 && lat > -35 && lng > -20 && lng < 55) return 'Africa';
    if (lat > 40 && lat < 60 && lng > 60 && lng < 150) return 'Central Asia';
    return null;
  }, [bounds, zoom]);

  // When a headline is clicked, fly to it and open the detail panel
  const handleHeadlineClick = useCallback((item: NewsItem) => {
    setCenterOn({ lat: item.lat, lng: item.lng });
    handleMarkerClick(item);
  }, [handleMarkerClick]);

  return (
    <div className="relative h-full w-full bg-black font-sans text-white overflow-hidden">
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
        news={news}
        onApplyFilters={async () => {
          if (daysAgo === 0) {
            // Live mode: only sync when backend says data is stale (avoids 429 rate limit)
            const needed = await isSyncNeeded().catch(() => false);
            if (needed) {
              console.log("[GeoNews] Live mode: sync needed, calling syncLatestNews()");
              setIsLoading(true);
              await syncLatestNews().catch(console.error);
              markSyncDone();
              setIsLoading(false);
            } else {
              console.log("[GeoNews] Live mode: sync not needed, skipping POST /api/sync");
            }
          }
          setApplyCounter((prev) => prev + 1);
        }}
        onSyncNews={async () => {
          // Manual sync: pull latest into DB then reload
          console.log("[GeoNews] Manual sync requested, calling syncLatestNews()");
          setIsLoading(true);
          await syncLatestNews().catch(console.error);
          markSyncDone();
          await loadNews();
          setIsLoading(false);
        }}
      />

      <main className="absolute inset-0 z-[1]">
        <Map
          news={displayedNews}
          interests={interests}
          zoom={zoom}
          currentBounds={bounds}
          onBoundsChange={handleBoundsChange}
          onMarkerClick={handleMarkerClick}
          showHeatmap={showHeatmap}
          showSentiment={showSentiment}
          centerOn={centerOn}
          onCenterComplete={handleCenterComplete}
          activeCategory={activeCategory}
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
            className="fixed top-0 right-0 h-full w-[400px] bg-black/70 backdrop-blur-2xl border-l border-[#00f0ff]/20 z-[3000] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-b from-[#00f0ff]/10 to-transparent">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_10px_#00f0ff]" />
                  <span className="text-[10px] text-[#00f0ff] font-mono font-bold tracking-widest uppercase">
                    Target Lock Acquired
                  </span>
                </div>

                {/* Location label */}
                <div className="flex items-center gap-1.5 text-white/55">
                  <MapPin size={11} className="shrink-0" />
                  <span className="text-[10px] font-mono tracking-wide">
                    {locationLabel || 'Resolving...'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
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
                    className="w-full relative group rounded-xl p-5 transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden bg-gradient-to-br from-[#00f0ff]/15 via-black/60 to-[#00f0ff]/10 border-2 border-[#00f0ff]/40 hover:border-[#00f0ff] cursor-pointer"
                    style={{ animation: 'ctaPulse 2s ease-in-out infinite, ctaBorderGlow 2s ease-in-out infinite' }}
                  >
                    {/* Shimmer sweep */}
                    <div className="absolute inset-0 pointer-events-none" style={{ animation: 'shimmerSweep 3s ease-in-out infinite' }}>
                      <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-[#00f0ff]/20 to-transparent" />
                    </div>

                    {/* Zap icon with pulse */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-[#00f0ff]/20 blur-xl" />
                      <Zap size={28} className="text-[#00f0ff] relative" style={{ animation: 'zapPulse 2s ease-in-out infinite', filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.8))' }} />
                    </div>

                    {/* Main CTA text */}
                    <div className="text-center relative z-10">
                      <p className="text-sm font-extrabold text-white tracking-wide">
                        Get AI Deep Analysis
                      </p>
                      <p className="text-[10px] text-[#00f0ff] mt-1 font-semibold tracking-widest uppercase">
                        Click for a detailed intelligence report
                      </p>
                    </div>

                    {/* Button badge */}
                    <div className="relative z-10 bg-[#00f0ff] text-black text-[10px] font-extrabold px-5 py-2 rounded-lg uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-colors shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                      Analyze Now
                    </div>
                  </button>
                ) : isDeepResearching ? (
                  <div className="w-full bg-black/40 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-[#00f0ff]" size={24} />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest">
                        Analyzing...
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-mono">
                        Generating detailed report
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-black/80 border border-[#00f0ff]/40 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                    <div className="bg-[#00f0ff]/10 border-b border-[#00f0ff]/30 px-4 py-3 flex items-center gap-2">
                      <Zap size={12} className="text-[#00f0ff]" />
                      <span className="text-[9px] font-bold text-[#00f0ff] uppercase tracking-widest">
                        AI Intelligence Report
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

      <AnimatePresence>
        {!selectedNews && (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <CommandAssistant
              onCenterOnCountry={handleCenterOnCountry}
              onNavigateTo={(coords) => setCenterOn(coords)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating headlines ticker - shows top 5 news from ALL categories, updates by region on zoom */}
      {!selectedNews && (
        <HeadlinesTicker
          news={news}
          regionLabel={regionLabel}
          onHeadlineClick={handleHeadlineClick}
          bounds={bounds}
          zoom={zoom}
        />
      )}

      <div className="scanline-overlay fixed inset-0 z-[10000] pointer-events-none" />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
