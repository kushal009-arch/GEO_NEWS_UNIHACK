import { GoogleGenAI } from "@google/genai";
import { NewsCategory, NewsItem, TrendAnalysis, UserInterest } from "../types";

// Temporarily keep AI disabled while debugging map + backend flow
const ai = null;

// Backend-style filtering (mirrors backend/server.js) for local fallback
function distanceDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function radiusByZoom(zoom: number): number {
  if (zoom >= 10) return 5;
  if (zoom >= 7) return 10;
  if (zoom >= 5) return 18;
  if (zoom >= 3) return 40;
  return 180;
}

function applyPersonalizedImpact(data: NewsItem[], interests: UserInterest[]): NewsItem[] {
  return data.map((news) => {
    let impact = news.personalizedImpact || null;

    if (!impact && interests.length > 0) {
      for (const interest of interests) {
        const dLat = news.lat - interest.lat;
        const dLng = news.lng - interest.lng;
        const distanceSq = dLat * dLat + dLng * dLng;

        let nearRoute = false;
        if (interest.type === "Travel Route" && interest.coords) {
          nearRoute = interest.coords.some((coord) => {
            const rLat = coord[0] - news.lat;
            const rLng = coord[1] - news.lng;
            return rLat * rLat + rLng * rLng < 100;
          });
        }

        if (distanceSq < 100 || nearRoute) {
          impact = `Proximity Alert: This event occurs along or near your designated ${interest.type} ("${interest.name}"). Expect potential operational disruptions or localized volatility.`;
          break;
        }
      }
    }

    return {
      ...news,
      personalizedImpact: impact || undefined
    };
  });
}

export async function fetchAllNews(interests: UserInterest[] = []): Promise<NewsItem[]> {
  try {
    const response = await fetch('http://localhost:5001/api/news/all');
    if (!response.ok) throw new Error('Backend request failed');
    const data: NewsItem[] = await response.json();
    return applyPersonalizedImpact(data, interests);
  } catch (error) {
    console.error('fetchAllNews error, using local fallback:', error);
    try {
      const res = await import('../data/historical_news.json');
      const raw = (res.default || res) as Array<Record<string, unknown>>;
      const results: NewsItem[] = raw.map((item) => {
        const cat = item.category as string;
        const norm = cat === 'Politics' || cat === 'World' ? 'Geopolitics' : cat;
        return {
          id: String(item.id),
          title: String(item.title),
          summary: String(item.summary),
          soWhat: String(item.soWhat),
          personalizedImpact: item.personalizedImpact != null ? String(item.personalizedImpact) : undefined,
          source: String(item.source),
          url: String(item.url),
          category: norm as NewsCategory,
          lat: Number(item.lat),
          lng: Number(item.lng),
          timestamp: String(item.timestamp),
          importance: Number(item.importance ?? 3),
          sentiment: (item.sentiment as NewsItem['sentiment']) || 'Neutral',
        };
      });
      return applyPersonalizedImpact(results, interests);
    } catch {
      return [];
    }
  }
}

export async function fetchNews(
  category: NewsCategory,
  bounds: { north: number; south: number; east: number; west: number },
  zoom: number,
  daysAgo: number = 0,
  interests: UserInterest[] = []
): Promise<NewsItem[]> {
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;

  try {
    const params = new URLSearchParams({
      lat: String(centerLat),
      lng: String(centerLng),
      zoom: String(zoom),
      category: category,
      daysAgo: String(daysAgo)
    });

    const response = await fetch(`http://localhost:5001/api/news?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Backend request failed");
    }

    let data: NewsItem[] = await response.json();
    console.log("BACKEND NEWS:", data);

    return applyPersonalizedImpact(data, interests);
  } catch (error) {
    console.error("Error fetching backend news:", error);
    // Fallback: local data with same filtering logic as backend/server.js
    try {
      const res = await import("../data/historical_news.json");
      let raw = (res.default || res) as Array<Record<string, unknown>>;
      let results: NewsItem[] = raw.map((item) => {
        const cat = item.category as string;
        const norm = cat === "Politics" || cat === "World" ? "Geopolitics" : cat;
        return {
          id: String(item.id),
          title: String(item.title),
          summary: String(item.summary),
          soWhat: String(item.soWhat),
          personalizedImpact: item.personalizedImpact != null ? String(item.personalizedImpact) : undefined,
          source: String(item.source),
          url: String(item.url),
          category: norm as NewsCategory,
          lat: Number(item.lat),
          lng: Number(item.lng),
          timestamp: String(item.timestamp),
          importance: Number(item.importance ?? 3),
          sentiment: (item.sentiment as NewsItem["sentiment"]) || "Neutral"
        };
      });

      if (category && category !== "Just In" && category !== "For You") {
        results = results.filter((item) => item.category === category);
      }

      const radius = radiusByZoom(zoom);
      if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
        results = results.filter((item) => {
          const distance = distanceDegrees(item.lat, item.lng, centerLat, centerLng);
          return distance <= radius;
        });
      }

      return applyPersonalizedImpact(results, interests);
    } catch (fallbackError) {
      console.error("Fallback news load failed:", fallbackError);
      return [];
    }
  }
}

// Deep Research using Local Llama 3 via Ollama
export async function deepResearch(newsItem: NewsItem): Promise<string> {
  const prompt = `
    You are a geopolitical intelligence analyst.
    Analyze the following news event and provide a "Deep Research Causality Report":

    Headline: ${newsItem.title}
    Summary: ${newsItem.summary}
    Category: ${newsItem.category}

    Please provide:
    1. Historical Context (What led to this?)
    2. Primary Ripple Effects (Immediate economic/social impact)
    3. Secondary Ripple Effects (Long-term global/supply chain impact)

    Format the response in clean Markdown. Keep names and place names capitalized; do not normalize or lowercase them. Be concise and authoritative.
  `;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:1b",
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error("Local LLM not responding. Ensure Ollama is running.");
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error during Deep Research:", error);
    return "[OFFLINE] **Local Intelligence Offline** \n\nEnsure Ollama is running locally and the `llama3.2:1b` model is available.";
  }
}

export async function analyzeTrends(): Promise<TrendAnalysis[]> {
  if (ai) {
    const model = "gemini-3.1-pro-preview";
    const prompt = `
      Analyze current global trends and predict potential events for the next 7-14 days.
      Focus on geopolitics, economics, and major social shifts.
      Return as a JSON array of objects: {trend, prediction, impact, confidence: 0-1}
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error(e);
    }
  }

  return [
    {
      trend: "Accelerated AGI Timelines",
      prediction: "Tech stocks surge by 15%",
      impact: "Global market rebalancing",
      confidence: 0.85
    },
    {
      trend: "Strained Ocean Freight",
      prediction: "Shipping container costs double",
      impact: "Increased consumer goods prices",
      confidence: 0.92
    }
  ];
}

// Sync/cache stubs - delegate to backend which owns all sync state
export async function isSyncNeeded(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:5001/api/sync/needed");
    if (!res.ok) return false;
    const json = await res.json();
    return json.needed ?? false;
  } catch {
    return false;
  }
}

export async function syncLatestNews(): Promise<void> {
  const res = await fetch("http://localhost:5001/api/sync", { method: "POST" });
  if (res.status === 429) {
    console.warn("[GeoNews] POST /api/sync returned 429 (rate limited). Skipping sync.");
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[GeoNews] POST /api/sync failed:", res.status, err);
    throw new Error(err.error || "Sync request failed");
  }
  console.log("[GeoNews] POST /api/sync succeeded");
}

export function markSyncDone(): void { /* no-op: backend tracks sync state */ }
export function invalidateNewsCache(): void { /* no-op: backend is the single source of truth */ }

/**
 * Trigger a NewsAPI -> Supabase sync via the backend.
 * Safe to call at any time; the backend enforces deduplication via upsert.
 */
export async function fetchAndStoreNews(): Promise<void> {
  await syncLatestNews();
}

/**
 * Fetch all stored news from Supabase (via backend).
 * This is the fast "from cache" path - no NewsAPI hit.
 */
export async function fetchNewsFromSupabase(interests: UserInterest[] = []): Promise<NewsItem[]> {
  return fetchAllNews(interests);
}
export async function getLocationLabel(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Nominatim error');
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.state || data.address?.country || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

export async function analyzeImage(base64Image: string): Promise<string> {
  if (ai) {
    const model = "gemini-3.1-pro-preview";
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
            { text: "Analyze this image in the context of news or global events." }
          ]
        }
      });
      return response.text || "Could not analyze image.";
    } catch (e) {
      return "Error during analysis.";
    }
  }

  return "Image analysis requires the Gemini API.";
}
