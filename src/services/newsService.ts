import { GoogleGenAI } from "@google/genai";
import { NewsCategory, NewsItem, TrendAnalysis, UserInterest } from "../types";

// Temporarily keep AI disabled while debugging map + backend flow
const ai = null;

export async function fetchNews(
  category: NewsCategory,
  bounds: { north: number; south: number; east: number; west: number },
  zoom: number,
  daysAgo: number = 0,
  interests: UserInterest[] = []
): Promise<NewsItem[]> {
  try {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;

    const params = new URLSearchParams({
      lat: String(centerLat),
      lng: String(centerLng),
      zoom: String(zoom),
      category: category
    });

    const response = await fetch(`http://localhost:5001/api/news?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Backend request failed");
    }

    let data: NewsItem[] = await response.json();
    console.log("BACKEND NEWS:", data);

    const newsWithImpact = data.map((news) => {
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

    return newsWithImpact;
  } catch (error) {
    console.error("Error fetching backend news:", error);
    return [];
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

    Format the response in clean Markdown. Be concise and authoritative.
  `;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
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
    return "⚠️ **Local Intelligence Offline** \n\nEnsure Ollama is running locally and the `llama3` model is available.";
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
