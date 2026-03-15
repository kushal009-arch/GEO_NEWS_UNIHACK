const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { createClient } = require("@supabase/supabase-js");
const { Client: PgClient } = require("pg");
const { COUNTRY_COORDS, COUNTRY_NAME_TO_CODE } = require("./countryCoords");

// ---------------------------------------------------------------------------
// Required additional tables — run once in Supabase SQL editor:
//

//
//   create table if not exists ai_forecasts (
//     id           bigint generated always as identity primary key,
//     category     text,
//     region       text,
//     risk_level   int,
//     forecast_text text,
//     so_what      text,
//     created_at   timestamptz default now()
//   );
// ---------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5001;

// ---------------------------------------------------------------------------
// Middleware stack: security, compression, CORS, JSON parsing, logging
// ---------------------------------------------------------------------------
app.use(helmet({ contentSecurityPolicy: false })); // security headers
app.use(compression()); // gzip responses
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Request logger — concise one-line per request
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";
    console.log(`${color}${req.method} ${req.originalUrl} ${status}\x1b[0m ${ms}ms`);
  });
  next();
});

// Rate limiters — different tiers for different endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again shortly." },
});
const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15,
  message: { error: "Sync rate limited. Try again in a few minutes." },
});
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "AI endpoint rate limited." },
});

app.use("/api/news", apiLimiter);
app.use("/api/sync", syncLimiter);
app.use("/api/chat", aiLimiter);
app.use("/api/generate-forecasts", aiLimiter);

// ---------------------------------------------------------------------------
// Supabase client (server-side, uses service role key)
// ---------------------------------------------------------------------------
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

if (!supabase) {
  console.warn(
    "[GeoNews] Supabase not configured - falling back to static data. " +
    "Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env to enable the database."
  );
}

// ---------------------------------------------------------------------------
// Row mapper: normalise Supabase DB rows -> API response shape (DRY)
// Handles both old column names (content/long/impact_score) and new schema
// ---------------------------------------------------------------------------
function mapRow(row) {
  const lat = Number(row.lat);
  const lng = Number(row.lng ?? row.long);
  return {
    id: String(row.id),
    title: row.title,
    summary: row.summary || row.content || row.title,
    soWhat: row.so_what || "",
    personalizedImpact: row.personalized_impact || undefined,
    source: row.source || "GeoNews",
    url: row.url || "",
    category: row.category,
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0,
    locationLabel: row.location_label || undefined,
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    importance: row.importance ?? row.impact_score ?? 3,
    sentiment: row.sentiment || "Neutral",
  };
}

// COUNTRY_COORDS and COUNTRY_NAME_TO_CODE are in ./countryCoords.js (all countries + name→code for QA).

// Keys sorted by length descending so "south korea" matches before "korea"
const COUNTRY_NAME_KEYS = Object.keys(COUNTRY_NAME_TO_CODE).sort((a, b) => b.length - a.length);

/** Extract country code from QA model answer (e.g. "Japan", "The event holds in Germany"). */
function countryCodeFromQAAnswer(rawAnswer) {
  if (!rawAnswer || typeof rawAnswer !== "string") return null;
  const normalized = rawAnswer.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.,;:!?]$/, "");
  if (!normalized) return null;

  // 1) Direct lookup
  let code = COUNTRY_NAME_TO_CODE[normalized] || COUNTRY_NAME_TO_CODE[normalized.replace(/^the\s+/, "")];
  if (code) return code;

  // 2) Strip common prefixes and try again
  const prefixes = [
    "the event holds in ", "this event holds in ", "this event is in ",
    "the event is in ", "the event takes place in ", "this event takes place in ",
    "in ", "in the "
  ];
  for (const p of prefixes) {
    if (normalized.startsWith(p)) {
      const rest = normalized.slice(p.length).trim().replace(/[.,;:!?]$/, "");
      code = COUNTRY_NAME_TO_CODE[rest] || COUNTRY_NAME_TO_CODE[rest.replace(/^the\s+/, "")];
      if (code) return code;
    }
  }

  // 3) Substring match: answer contains a known country name (longest first)
  for (const key of COUNTRY_NAME_KEYS) {
    const re = new RegExp("(^|[^a-z])" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z])", "i");
    if (re.test(normalized)) {
      code = COUNTRY_NAME_TO_CODE[key];
      if (code) return code;
    }
  }

  return null;
}

// NewsAPI source name -> country code (best-effort geocoding since API has no source.country)
const SOURCE_COUNTRY_MAP = {
  "bbc news": "gb", "bbc sport": "gb", "the guardian": "gb", "the telegraph": "gb",
  "the independent": "gb", "sky news": "gb", "daily mail": "gb", "evening standard": "gb",
  "the times": "gb", "financial times": "gb", "the economist": "gb",
  "reuters": "gb", "the associated press": "us", "associated press": "us",
  "cnn": "us", "fox news": "us", "msnbc": "us", "nbc news": "us", "abc news": "us",
  "cbs news": "us", "usa today": "us", "the new york times": "us", "new york times": "us",
  "the washington post": "us", "washington post": "us", "wall street journal": "us",
  "bloomberg": "us", "business insider": "us", "buzzfeed": "us", "politico": "us",
  "the verge": "us", "wired": "us", "techcrunch": "us", "engadget": "us",
  "newsweek": "us", "time": "us", "fortune": "us", "fast company": "us",
  "npr": "us", "vice": "us", "axios": "us", "the hill": "us", "vox": "us",
  "spiegel online": "de", "der spiegel": "de", "die zeit": "de", "focus": "de",
  "le monde": "fr", "le figaro": "fr", "liberation": "fr",
  "la repubblica": "it", "corriere della sera": "it",
  "el pais": "es", "el mundo": "es",
  "the hindu": "in", "times of india": "in", "hindustan times": "in",
  "ndtv": "in", "india today": "in",
  "south china morning post": "hk", "xinhua": "cn", "global times": "cn",
  "japan times": "jp", "nhk world": "jp", "asahi shimbun": "jp",
  "al jazeera": "ae", "gulf news": "ae", "arab news": "sa",
  "the australian": "au", "sydney morning herald": "au", "abc (australian broadcasting corporation)": "au",
  "ynetnews": "il", "haaretz": "il", "the jerusalem post": "il",
  "rt": "ru", "tass": "ru", "ria novosti": "ru",
  "toronto star": "ca", "globe and mail": "ca", "cbc news": "ca",
  "afr": "au", "australian financial review": "au",
};

/**
 * Map a NewsAPI article to a 2-letter country code for geolocation.
 * Returns { code, isRestOfWorld }. isRestOfWorld true when no source or title match (fallback).
 */
function detectCountry(article) {
  const sourceName = (article.source?.name || "").toLowerCase();
  if (SOURCE_COUNTRY_MAP[sourceName]) return { code: SOURCE_COUNTRY_MAP[sourceName], isRestOfWorld: false };
  const title = (article.title || "").toLowerCase();
  if (/\bukraine\b/.test(title)) return { code: "ua", isRestOfWorld: false };
  if (/\brussia\b/.test(title)) return { code: "ru", isRestOfWorld: false };
  if (/\bchina\b|\bchinese\b/.test(title)) return { code: "cn", isRestOfWorld: false };
  if (/\biran\b|\bteheran\b/.test(title)) return { code: "ir", isRestOfWorld: false };
  if (/\bisrael\b|\bgaza\b/.test(title)) return { code: "il", isRestOfWorld: false };
  if (/\bindian?\b/.test(title)) return { code: "in", isRestOfWorld: false };
  if (/\bjapan\b|\bjapanese\b/.test(title)) return { code: "jp", isRestOfWorld: false };
  if (/\bgermany\b|\bgerman\b/.test(title)) return { code: "de", isRestOfWorld: false };
  if (/\bfrance\b|\bfrench\b/.test(title)) return { code: "fr", isRestOfWorld: false };
  if (/\buk\b|\bbritain\b|\bbritish\b/.test(title)) return { code: "gb", isRestOfWorld: false };
  if (/\baustralia\b|\baustralian\b/.test(title)) return { code: "au", isRestOfWorld: false };
  if (/\bcanada\b|\bcanadian\b/.test(title)) return { code: "ca", isRestOfWorld: false };
  if (/\bbrazil\b|\bbrazilian\b/.test(title)) return { code: "br", isRestOfWorld: false };
  if (/\bsouth korea\b|\bkorean\b/.test(title)) return { code: "kr", isRestOfWorld: false };
  if (/\bsaudi arabia\b|\briyadh\b/.test(title)) return { code: "sa", isRestOfWorld: false };
  if (/\bsingapore\b/.test(title)) return { code: "sg", isRestOfWorld: false };
  if (/\bturkey\b|\bturkish\b|\bandkara\b/.test(title)) return { code: "tr", isRestOfWorld: false };
  if (/\bpoland\b|\bpolish\b/.test(title)) return { code: "pl", isRestOfWorld: false };
  if (/\bgreece\b|\bgreek\b/.test(title)) return { code: "gr", isRestOfWorld: false };
  if (/\bromania\b|\bbucharest\b/.test(title)) return { code: "ro", isRestOfWorld: false };
  if (/\bnigeria\b|\blagos\b/.test(title)) return { code: "ng", isRestOfWorld: false };
  if (/\bsouth africa\b/.test(title)) return { code: "za", isRestOfWorld: false };
  return { code: "us", isRestOfWorld: true }; // no match -> Rest of World
}

// DistilBERT QA pipeline (loaded on server init); null if load failed
let qaPipeline = null;

const QA_COUNTRY_QUESTION = "In which country does this event hold?";

/**
 * Use DistilBERT QA to infer country from article text. Returns { code, isRestOfWorld }.
 * Maps model output to country code via countryCodeFromQAAnswer, then to coordinates via COUNTRY_COORDS.
 */
async function inferCountryFromArticle(article, pipeline) {
  if (!pipeline) return detectCountry(article);
  const title = (article.title || "").trim();
  const desc = (article.description || article.content || article.title || "").trim();
  const context = `${title}. ${desc}`.trim();
  if (context.length < 20) return detectCountry(article);
  try {
    const out = await pipeline(QA_COUNTRY_QUESTION, context.slice(0, 512));
    const raw = (out && out.answer) ? String(out.answer).trim() : "";
    const code = countryCodeFromQAAnswer(raw);
    if (code && COUNTRY_COORDS[code]) {
      return { code, isRestOfWorld: false };
    }
  } catch (err) {
    console.warn("[GeoNews] QA country inference failed for article:", err.message);
  }
  return detectCountry(article);
}

// NewsAPI category -> GeoNews category
const CATEGORY_MAP = {
  business: "Business",
  technology: "Technology",
  science: "Climate",
  health: "Climate",
  general: "Geopolitics",
  entertainment: "Geopolitics",
  sports: "Geopolitics",
};

// Sentiment heuristics based on keywords in title
function inferSentiment(title) {
  const t = title.toLowerCase();
  if (/crisis|war|attack|collapse|flood|fire|death|conflict|explosion|sanctions|protest|strike/.test(t))
    return "Negative";
  if (/growth|deal|peace|recovery|launch|surge|rise|breakthrough|investment/.test(t))
    return "Positive";
  if (/tension|warn|risk|concern|uncertain|threat|fear/.test(t))
    return "Anxious";
  return "Neutral";
}

// Importance heuristic (1-5) based on source/title keywords
function inferImportance(article) {
  const t = (article.title || "").toLowerCase();
  if (/war|nuclear|collapse|crisis/.test(t)) return 5;
  if (/attack|conflict|sanctions|explosion/.test(t)) return 4;
  return 3;
}

// ---------------------------------------------------------------------------
// Groq helper: call Groq chat completions with retry on 429
// ---------------------------------------------------------------------------
async function callGroq(messages, { temperature = 0.5, max_tokens = 512 } = {}) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (res.status === 429 && attempt === 0) {
      console.warn("[GeoNews] Groq rate limited, waiting 3s...");
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sync: fetch from NewsAPI, enrich via Groq, upsert into Supabase
// ---------------------------------------------------------------------------
async function syncNewsFromAPI() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("[GeoNews] NEWS_API_KEY not set - skipping NewsAPI sync.");
    return { synced: 0, enriched: 0 };
  }
  if (!supabase) {
    console.warn("[GeoNews] Supabase not configured - skipping sync.");
    return { synced: 0, enriched: 0 };
  }

  const categories = ["business", "technology", "general", "science", "health"];
  const allArticles = [];

  for (const cat of categories) {
    try {
      const url =
        `https://newsapi.org/v2/top-headlines` +
        `?category=${cat}&language=en&pageSize=20&apiKey=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`NewsAPI ${res.status}: ${await res.text()}`);
      const json = await res.json();
      if (json.articles) {
        allArticles.push(...json.articles.map((a) => ({ ...a, _cat: cat })));
      }
    } catch (err) {
      console.error(`[GeoNews] NewsAPI fetch failed for category '${cat}':`, err.message);
    }
  }

  const filtered = allArticles.filter((a) => a.title && a.title !== "[Removed]" && a.url);
  const rows = [];
  const BATCH = 5;
  for (let i = 0; i < filtered.length; i += BATCH) {
    const batch = filtered.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((a) => inferCountryFromArticle(a, qaPipeline)));
    for (let j = 0; j < batch.length; j++) {
      const a = batch[j];
      const { code, isRestOfWorld } = results[j];
      const coords = COUNTRY_COORDS[code] || COUNTRY_COORDS["us"];
      const jitter = () => (Math.random() - 0.5) * 1.5;
      rows.push({
        title: a.title,
        content: a.description || a.title,
        source: a.source?.name || "Unknown",
        url: a.url,
        category: CATEGORY_MAP[a._cat] || "Geopolitics",
        lat: coords.lat + jitter(),
        long: coords.lng + jitter(),
        location_label: isRestOfWorld ? "ROW" : null,
        impact_score: inferImportance(a),
        sentiment: inferSentiment(a.title),
      });
    }
  }

  if (rows.length === 0) {
    console.log("[GeoNews] No articles to upsert.");
    return { synced: 0, enriched: 0 };
  }

  // Upsert raw articles first (fast)
  const { error } = await supabase
    .from("news_events")
    .upsert(rows, { onConflict: "title", ignoreDuplicates: true });

  if (error) {
    console.error("[GeoNews] Supabase upsert error:", error.message);
    throw error;
  }

  console.log(`[GeoNews] Synced ${rows.length} articles to Supabase.`);

  // Batch-enrich articles that lack a so_what (Groq AI - best-effort, non-blocking)
  let enriched = 0;
  if (process.env.GROQ_API_KEY) {
    try {
      const { data: needEnrich } = await supabase
        .from("news_events")
        .select("id, title, category")
        .or("content.is.null,content.eq.")
        .order("id", { ascending: false })
        .limit(10);

      if (needEnrich?.length) {
        const titles = needEnrich.map((n, i) => `${i + 1}. [${n.category}] ${n.title}`).join("\n");
        const prompt = `For each headline below, write a brief 1-sentence "soWhat" (why it matters) and a 1-sentence "summary". Return a JSON array where each element has { index: number, summary: string, soWhat: string, sentiment: string, importance: number }.\n\n${titles}\n\nReturn ONLY valid JSON array.`;

        const raw = await callGroq([
          { role: "system", content: "You are a geopolitical analyst. Return only valid JSON array." },
          { role: "user", content: prompt },
        ], { max_tokens: 1024, temperature: 0.3 });

        if (raw) {
          const clean = raw.replace(/```json\n?|\n?```/g, "").trim();
          const enrichments = JSON.parse(clean);
          for (const e of enrichments) {
            const row = needEnrich[e.index - 1];
            if (!row) continue;
            await supabase
              .from("news_events")
              .update({
                content: e.summary || undefined,
                sentiment: e.sentiment || undefined,
                impact_score: e.importance || undefined,
              })
              .eq("id", row.id);
            enriched++;
          }
          console.log(`[GeoNews] AI-enriched ${enriched} articles.`);
        }
      }
    } catch (err) {
      console.warn("[GeoNews] AI enrichment failed (non-critical):", err.message);
    }
  }

  return { synced: rows.length, enriched };
}

// ---------------------------------------------------------------------------
// Static fallback data (used when Supabase is not configured)
// ---------------------------------------------------------------------------
const newsData = [
    {
        id: "1",
        title: "Flood Alert in Melbourne",
        summary:
            "Heavy rainfall is expected across parts of Victoria, with possible disruption to transport and logistics.",
        soWhat:
            "Weather-related interruptions may affect transport routes, deliveries, and local operations.",
        personalizedImpact:
            "This may affect users monitoring Australian supply and transport networks.",
        source: "GeoNews Local Desk",
        url: "https://example.com/flood-alert-melbourne",
        category: "Geopolitics",
        lat: -37.8136,
        lng: 144.9631,
        timestamp: "2026-03-14T01:45:00Z",
        importance: 4,
        sentiment: "Negative"
    },
    {
        id: "2",
        title: "Victoria Heat Stress Warning",
        summary:
            "Rising temperatures across Victoria are increasing climate stress for transport, health systems, and local infrastructure.",
        soWhat:
            "Climate-linked disruptions may affect public health readiness and infrastructure reliability.",
        personalizedImpact:
            "Important for users tracking urban climate and resilience risks in Australia.",
        source: "GeoNews Climate Desk",
        url: "https://example.com/victoria-heat-warning",
        category: "Climate",
        lat: -37.9,
        lng: 145.1,
        timestamp: "2026-03-14T03:10:00Z",
        importance: 3,
        sentiment: "Anxious"
    },
    {
        id: "3",
        title: "Australian Retail Spending Slows",
        summary:
            "Consumer demand has softened in major Australian cities amid cost-of-living pressure.",
        soWhat:
            "Business confidence and discretionary spending may weaken in the short term.",
        personalizedImpact:
            "Relevant for users tracking economic pressure in Australia.",
        source: "GeoNews Market Brief",
        url: "https://example.com/aus-retail-slowdown",
        category: "Business",
        lat: -33.8688,
        lng: 151.2093,
        timestamp: "2026-03-14T02:30:00Z",
        importance: 3,
        sentiment: "Neutral"
    },
    {
        id: "4",
        title: "Australian AI Infrastructure Expansion",
        summary:
            "Investment in compute infrastructure is accelerating across Australian innovation hubs.",
        soWhat:
            "Technology capacity and startup ecosystems may strengthen in the medium term.",
        personalizedImpact:
            "Relevant for users tracking technology growth in Australia.",
        source: "GeoNews Tech Desk",
        url: "https://example.com/australia-ai-infra",
        category: "Technology",
        lat: -37.81,
        lng: 144.96,
        timestamp: "2026-03-14T05:00:00Z",
        importance: 3,
        sentiment: "Positive"
    },
    {
        id: "5",
        title: "Dubai Trade Corridor Under Pressure",
        summary:
            "Port and freight flows across the Gulf are facing elevated uncertainty amid regional tension.",
        soWhat:
            "Shipping lead times and cargo costs may rise across Gulf-linked routes.",
        personalizedImpact:
            "Highly relevant for users tracking energy and shipping exposure in the UAE.",
        source: "GeoNews Trade Monitor",
        url: "https://example.com/dubai-trade-corridor",
        category: "Geopolitics",
        lat: 25.2048,
        lng: 55.2708,
        timestamp: "2026-03-14T00:20:00Z",
        importance: 5,
        sentiment: "Anxious"
    },
    {
        id: "6",
        title: "UAE Heat Risk Intensifies",
        summary:
            "Persistent heat and humidity are raising climate risk across key urban corridors in the UAE.",
        soWhat:
            "Energy demand, public comfort, and outdoor operations may all be affected.",
        personalizedImpact:
            "Important for users monitoring climate and infrastructure in the Gulf.",
        source: "GeoNews Climate Monitor",
        url: "https://example.com/uae-heat-risk",
        category: "Climate",
        lat: 24.4539,
        lng: 54.3773,
        timestamp: "2026-03-14T04:00:00Z",
        importance: 4,
        sentiment: "Anxious"
    },
    {
        id: "7",
        title: "Gulf Energy Talks Stabilize Outlook",
        summary:
            "Regional energy discussions have reduced immediate fears of a major supply shock.",
        soWhat:
            "Short-term energy market volatility may ease if coordination continues.",
        personalizedImpact:
            "Relevant for users following energy markets and Gulf politics.",
        source: "GeoNews Energy Brief",
        url: "https://example.com/gulf-energy-talks",
        category: "Business",
        lat: 24.4667,
        lng: 54.3667,
        timestamp: "2026-03-13T22:10:00Z",
        importance: 4,
        sentiment: "Positive"
    },
    {
        id: "8",
        title: "UAE Smart Infrastructure Rollout",
        summary:
            "Technology modernization projects are expanding across logistics and public systems in the UAE.",
        soWhat:
            "Tech-led infrastructure efficiency may improve across high-value urban corridors.",
        personalizedImpact:
            "Relevant for users following smart-city and logistics technology in the Gulf.",
        source: "GeoNews Innovation Desk",
        url: "https://example.com/uae-smart-infra",
        category: "Technology",
        lat: 25.276987,
        lng: 55.296249,
        timestamp: "2026-03-14T05:15:00Z",
        importance: 3,
        sentiment: "Positive"
    },
    {
        id: "9",
        title: "Singapore Shipping Delays Increase",
        summary:
            "Container congestion has increased average delays across major Southeast Asian routes.",
        soWhat:
            "Longer freight times can raise costs and delay supply chain planning.",
        personalizedImpact:
            "Relevant to users tracking shipping corridors and logistics disruption.",
        source: "GeoNews Trade Monitor",
        url: "https://example.com/shipping-delays",
        category: "Business",
        lat: 1.3521,
        lng: 103.8198,
        timestamp: "2026-03-14T00:20:00Z",
        importance: 5,
        sentiment: "Anxious"
    },
    {
        id: "10",
        title: "Regional Cyber Alerts Across East Asia",
        summary:
            "Security teams have flagged elevated cyber probing targeting regional logistics and infrastructure systems.",
        soWhat:
            "Technology and infrastructure exposure may rise across digital trade networks.",
        personalizedImpact:
            "Relevant for users tracking cyber and infrastructure risk in Asia.",
        source: "GeoNews Cyber Desk",
        url: "https://example.com/east-asia-cyber-alerts",
        category: "Technology",
        lat: 35.6762,
        lng: 139.6503,
        timestamp: "2026-03-14T05:00:00Z",
        importance: 4,
        sentiment: "Negative"
    },
    {
        id: "11",
        title: "Southeast Asia Climate Stress Builds",
        summary:
            "Rising humidity and temperature patterns are increasing operational and infrastructure strain across Southeast Asia.",
        soWhat:
            "Climate-linked disruption risk may rise across ports, transport, and energy systems.",
        personalizedImpact:
            "Relevant for users tracking climate exposure in Asian trade networks.",
        source: "GeoNews Climate Desk",
        url: "https://example.com/sea-climate-stress",
        category: "Climate",
        lat: 13.7563,
        lng: 100.5018,
        timestamp: "2026-03-14T04:45:00Z",
        importance: 3,
        sentiment: "Anxious"
    },
    {
        id: "12",
        title: "East Asia Strategic Tensions Rise",
        summary:
            "Military and diplomatic signaling across East Asia has increased regional uncertainty.",
        soWhat:
            "Regional trade, shipping, and investment confidence may face short-term stress.",
        personalizedImpact:
            "Relevant for users monitoring geopolitical exposure in East Asia.",
        source: "GeoNews Strategic Desk",
        url: "https://example.com/east-asia-tensions",
        category: "Geopolitics",
        lat: 25.033,
        lng: 121.5654,
        timestamp: "2026-03-14T03:50:00Z",
        importance: 5,
        sentiment: "Negative"
    }
];

function distanceDegrees(lat1, lng1, lat2, lng2) {
    const dLat = lat1 - lat2;
    const dLng = lng1 - lng2;
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

function radiusByZoom(zoom) {
    if (zoom >= 10) return 5;
    if (zoom >= 7) return 10;
    if (zoom >= 5) return 18;
    if (zoom >= 3) return 40;
    return 180;
}

app.get("/", (req, res) => {
    res.json({
        status: "running",
        version: "2.0.0",
        supabase: !!supabase,
        endpoints: [
            "GET  /api/health",
            "GET  /api/news",
            "GET  /api/news/all",
            "GET  /api/news/search?q=term",
            "GET  /api/news/stats",
            "GET  /api/news/:id",
            "POST /api/sync",
            "GET  /api/sync/needed",
            "GET  /api/risk-indices",
            "POST /api/risk-indices",
            "POST /api/generate-forecasts",
            "POST /api/chat",
            "POST /api/enrich",
        ],
    });
});

// ---------------------------------------------------------------------------
// GET /api/health - deep health check (DB connectivity, API key status)
// ---------------------------------------------------------------------------
app.get("/api/health", async (req, res) => {
    const health = {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            supabase: { configured: !!supabase, connected: false },
            newsapi: { configured: !!process.env.NEWS_API_KEY },
            groq: { configured: !!process.env.GROQ_API_KEY },
        },
    };

    if (supabase) {
        try {
            const { count, error } = await supabase
                .from("news_events")
                .select("*", { count: "exact", head: true });
            if (error) throw error;
            health.services.supabase.connected = true;
            health.services.supabase.newsCount = count;
        } catch (err) {
            health.services.supabase.error = err.message;
            health.status = "degraded";
        }
    }

    const statusCode = health.status === "ok" ? 200 : 503;
    res.status(statusCode).json(health);
});

// ---------------------------------------------------------------------------
// GET /api/news - fetch from Supabase (with static fallback)
// Supports: ?category=X&lat=N&lng=N&zoom=N&daysAgo=N&limit=N
// ---------------------------------------------------------------------------
app.get("/api/news", async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const zoom = Number(req.query.zoom || 3);
    const category = req.query.category;
    const daysAgo = Number(req.query.daysAgo || 0);
    const limit = Math.min(Number(req.query.limit || 200), 500);

    if (supabase) {
        try {
            let query = supabase
                .from("news_events")
                .select("*")
                .order("id", { ascending: false })
                .limit(limit);

            if (category && category !== "Just In" && category !== "For You") {
                query = query.eq("category", category);
            }

            // daysAgo filter: use created_at (timestamp column added by ensureTimestampColumn when DATABASE_URL set)
            if (daysAgo > 0) {
                const since = new Date(Date.now() - daysAgo * 86400000).toISOString();
                query = query.gte("created_at", since);
            }

            const { data, error } = await query;
            if (error) throw error;

            let results = (data || []).map(mapRow);

            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                const radius = radiusByZoom(zoom);
                results = results.filter(
                    (item) => distanceDegrees(item.lat, item.lng, lat, lng) <= radius
                );
            }

            return res.json(results);
        } catch (err) {
            console.error("[GeoNews] Supabase query failed, using static fallback:", err.message);
        }
    }

    // Static fallback
    let results = [...newsData];
    if (category && category !== "Just In" && category !== "For You") {
        results = results.filter((item) => item.category === category);
    }
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const radius = radiusByZoom(zoom);
        results = results.filter(
            (item) => distanceDegrees(item.lat, item.lng, lat, lng) <= radius
        );
    }
    res.json(results);
});

// ---------------------------------------------------------------------------
// GET /api/news/all - everything from Supabase, no geo-filter (initial load)
// ---------------------------------------------------------------------------
app.get("/api/news/all", async (req, res) => {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from("news_events")
                .select("*")
                .order("id", { ascending: false })
                .limit(500);

            if (error) throw error;
            return res.json((data || []).map(mapRow));
        } catch (err) {
            console.error("[GeoNews] /api/news/all Supabase error, using static fallback:", err.message);
        }
    }
    res.json(newsData);
});

// ---------------------------------------------------------------------------
// GET /api/news/search?q=term - full-text search on title + summary
// ---------------------------------------------------------------------------
app.get("/api/news/search", async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });
    if (q.length > 200) return res.status(400).json({ error: "Query too long" });

    if (supabase) {
        try {
            const term = `%${q}%`;
            const { data, error } = await supabase
                .from("news_events")
                .select("*")
                .or(`title.ilike.${term},content.ilike.${term}`)
                .order("id", { ascending: false })
                .limit(50);

            if (error) throw error;
            return res.json((data || []).map(mapRow));
        } catch (err) {
            console.error("[GeoNews] search error:", err.message);
        }
    }

    // Static fallback
    const lower = q.toLowerCase();
    const results = newsData.filter(
        (item) =>
            item.title.toLowerCase().includes(lower) ||
            (item.summary || "").toLowerCase().includes(lower)
    );
    res.json(results);
});

// ---------------------------------------------------------------------------
// GET /api/news/stats - category counts, sentiment breakdown
// ---------------------------------------------------------------------------
app.get("/api/news/stats", async (req, res) => {
    if (!supabase) {
        return res.json({
            total: newsData.length,
            categories: {},
            sentiments: {},
        });
    }

    try {
        const { data, error } = await supabase
            .from("news_events")
            .select("category, sentiment")
            .order("id", { ascending: false })
            .limit(1000);
        if (error) throw error;

        const categories = {};
        const sentiments = {};
        for (const row of data || []) {
            categories[row.category] = (categories[row.category] || 0) + 1;
            sentiments[row.sentiment || "Neutral"] = (sentiments[row.sentiment || "Neutral"] || 0) + 1;
        }

        res.json({
            total: (data || []).length,
            categories,
            sentiments,
        });
    } catch (err) {
        console.error("[GeoNews] stats error:", err.message);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// ---------------------------------------------------------------------------
// GET /api/news/:id - fetch a single news item by ID
// ---------------------------------------------------------------------------
app.get("/api/news/:id", async (req, res) => {
    const id = req.params.id;

    if (supabase) {
        try {
            const { data, error } = await supabase
                .from("news_events")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: "Not found" });
            return res.json(mapRow(data));
        } catch (err) {
            if (err.code === "PGRST116") return res.status(404).json({ error: "Not found" });
            console.error("[GeoNews] /api/news/:id error:", err.message);
        }
    }

    const item = newsData.find((n) => n.id === id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
});

// ---------------------------------------------------------------------------
// POST /api/sync - trigger a NewsAPI -> Supabase sync
// ---------------------------------------------------------------------------
app.post("/api/sync", async (req, res) => {
    try {
        const result = await syncNewsFromAPI();
        res.json({ ok: true, message: "Sync completed", ...result });
    } catch (err) {
        res.status(500).json({ ok: false, error: String(err.message) });
    }
});

// ---------------------------------------------------------------------------
// GET /api/sync/needed - returns { needed: bool } based on age of newest article
// ---------------------------------------------------------------------------
app.get("/api/sync/needed", async (req, res) => {
    if (!supabase) return res.json({ needed: false });
    try {
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;
        const { data } = await supabase
            .from("news_events")
            .select("created_at")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (!data) return res.json({ needed: true });

        const age = Date.now() - new Date(data.created_at).getTime();
        res.json({ needed: age > THIRTY_MINUTES_MS });
    } catch {
        res.json({ needed: true });
    }
});

// ---------------------------------------------------------------------------
// GET /api/risk-indices - read latest AI risk assessments
// ---------------------------------------------------------------------------
app.get("/api/risk-indices", async (req, res) => {
    if (!supabase) return res.json([]);
    try {
        const { data, error } = await supabase
            .from("risk_indices")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(4);
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("[GeoNews] risk_indices fetch error:", err.message);
        res.json([]);
    }
});

// ---------------------------------------------------------------------------
// POST /api/risk-indices - save AI-generated risk assessments
// ---------------------------------------------------------------------------
app.post("/api/risk-indices", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { forecasts } = req.body;
    if (!forecasts?.length) return res.status(400).json({ error: "No forecasts provided" });
    try {
        const { error } = await supabase
            .from("risk_indices")
            .upsert(
                forecasts.map((f) => ({ ...f, created_at: new Date().toISOString() })),
                { onConflict: "category" }
            );
        if (error) throw error;
        res.json({ ok: true });
    } catch (err) {
        console.error("[GeoNews] risk_indices save error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------------------------
// POST /api/generate-forecasts
// Pulls latest 10 news rows, sends to Groq, saves to risk_indices + ai_forecasts
// ---------------------------------------------------------------------------
app.post("/api/generate-forecasts", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: "GROQ_API_KEY not configured" });

    try {
        const { data: newsRows, error } = await supabase
            .from("news_events")
            .select("title, category, sentiment")
            .order("id", { ascending: false })
            .limit(15);
        if (error) throw error;
        if (!newsRows?.length) return res.json({ ok: true, forecasts: [] });

        const newsContext = newsRows
            .map((n, i) => `${i + 1}. [${n.category}] ${n.title} (sentiment: ${n.sentiment})`)
            .join("\n");

        const prompt = `You are a geopolitical risk analyst. Based on these ${newsRows.length} recent news events:\n${newsContext}\n\nGenerate a JSON array of exactly 4 regional risk assessments, one for each: Geopolitics, Climate, Economy, Technology.\nEach object: { region: string, category: string, risk_level: number (1-100), label: string (e.g. 'Regional Volatility: Red Sea'), level_label: string (Low|Moderate|High|Severe), forecast: string (48h, 1-2 sentences), so_what: string (plain English, 1-2 sentences) }\nReturn ONLY valid JSON array, no markdown, no explanation.`;

        const rawContent = await callGroq([
            { role: "system", content: "You are a geopolitical risk analyst. Return only valid JSON array." },
            { role: "user", content: prompt },
        ], { temperature: 0.6, max_tokens: 1024 });

        if (!rawContent) throw new Error("Groq returned empty response");

        let forecasts;
        try {
            const clean = rawContent.replace(/```json\n?|\n?```/g, "").trim();
            forecasts = JSON.parse(clean);
        } catch (e) {
            throw new Error("Failed to parse Groq response as JSON");
        }

        // Save to risk_indices (upsert by category so there's always one record per category)
        const { error: riskErr } = await supabase
            .from("risk_indices")
            .upsert(
                forecasts.map((f) => ({ ...f, created_at: new Date().toISOString() })),
                { onConflict: "category" }
            );
        if (riskErr) console.error("[GeoNews] risk_indices upsert error:", riskErr.message);

        // Append to ai_forecasts history
        await supabase.from("ai_forecasts").insert(
            forecasts.map((f) => ({
                category: f.category,
                region: f.region,
                risk_level: f.risk_level,
                forecast_text: f.forecast,
                so_what: f.so_what,
                created_at: new Date().toISOString(),
            }))
        );

        console.log(`[GeoNews] Generated ${forecasts.length} risk index forecasts.`);
        res.json({ ok: true, forecasts });
    } catch (err) {
        console.error("[GeoNews] generate-forecasts error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------------------------
// POST /api/chat - Groq-powered Command Assistant proxy
// Injects recent news context so the assistant is aware of current events
// ---------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: "GROQ_API_KEY not configured" });

    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "messages required" });

    try {
        // Inject recent news headlines into system context so the assistant knows current events
        let newsContext = "";
        if (supabase) {
            try {
                const { data } = await supabase
                    .from("news_events")
                    .select("title, category, sentiment")
                    .order("created_at", { ascending: false })
                    .limit(8);
                if (data?.length) {
                    newsContext = "\n\nRecent headlines you're aware of:\n" +
                        data.map((n) => `- [${n.category}] ${n.title} (${n.sentiment})`).join("\n");
                }
            } catch { /* non-critical */ }
        }

        const systemMsg = {
            role: "system",
            content: `You are the GeoNews Command Assistant, an AI that helps users navigate a global news intelligence map. You can suggest countries to explore, explain news events, and provide geopolitical context. Be concise and authoritative.${newsContext}`
        };

        const enrichedMessages = [systemMsg, ...messages.filter((m) => m.role !== "system")];

        const content = await callGroq(enrichedMessages, { temperature: 0.5, max_tokens: 400 });
        if (content === null) throw new Error("Groq call failed");

        res.json({ content });
    } catch (err) {
        console.error("[GeoNews] /api/chat error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------------------------
// POST /api/enrich - AI-enrich a single news item (generate soWhat + summary)
// Used when a news item from NewsAPI lacks a good summary
// ---------------------------------------------------------------------------
app.post("/api/enrich", async (req, res) => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: "GROQ_API_KEY not configured" });

    const { title, source, category } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    try {
        const prompt = `You are a concise geopolitical news analyst.
Given this headline: "${title}" (source: ${source || "unknown"}, category: ${category || "General"})

Return a JSON object with exactly:
{
  "summary": "2-3 sentence factual summary of what this means",
  "soWhat": "1-2 sentence 'so what' explaining why this matters to someone tracking global risks",
  "sentiment": "one of: Positive, Neutral, Negative, Anxious, Panic, Celebratory",
  "importance": number 1-5
}
Return ONLY the JSON object, no markdown.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are a news analyst. Return only valid JSON." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 300,
            }),
        });

        if (!groqRes.ok) throw new Error(`Groq API error: ${groqRes.status}`);
        const groqData = await groqRes.json();
        const raw = groqData.choices?.[0]?.message?.content || "";
        const clean = raw.replace(/```json\n?|\n?```/g, "").trim();
        const enriched = JSON.parse(clean);

        res.json(enriched);
    } catch (err) {
        console.error("[GeoNews] /api/enrich error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------------------------
// POST /api/deep-research - Generate a detailed causality report for a news item
// Uses Groq (llama-3.1-8b-instant) to produce a structured intelligence report.
// ---------------------------------------------------------------------------
app.post("/api/deep-research", aiLimiter, async (req, res) => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: "GROQ_API_KEY not configured" });

    const { title, summary, category } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    try {
        const prompt = `You are a geopolitical intelligence analyst.
Analyze the following news event and provide a "Deep Research Causality Report":

Headline: ${title}
Summary: ${summary || title}
Category: ${category || "General"}

Please provide:
1. **Historical Context** (What led to this?)
2. **Primary Ripple Effects** (Immediate economic/social impact)
3. **Secondary Ripple Effects** (Long-term global/supply chain impact)
4. **Risk Assessment** (Key risks and their likelihood)
5. **Strategic Outlook** (What to watch for next)

Format the response in clean Markdown with headers. Be concise and authoritative. Keep names and place names capitalized.`;

        const raw = await callGroq([
            { role: "system", content: "You are a senior geopolitical intelligence analyst providing deep-dive reports. Use markdown formatting with headers." },
            { role: "user", content: prompt },
        ], { max_tokens: 1024, temperature: 0.4 });

        if (!raw) {
            return res.status(503).json({ error: "AI service unavailable" });
        }

        res.json({ report: raw });
    } catch (err) {
        console.error("[GeoNews] /api/deep-research error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------------------------
// Serve built frontend (production) — dist/ lives one level up from backend/
// ---------------------------------------------------------------------------
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

// ---------------------------------------------------------------------------
// Global error handler - catches unhandled route errors
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
    console.error("[GeoNews] Unhandled error:", err.message);
    res.status(500).json({ error: "Internal server error" });
});

// SPA fallback — send index.html for any non-API route
app.use((req, res) => {
    const indexPath = path.join(distPath, "index.html");
    const fs = require("fs");
    if (fs.existsSync(indexPath) && !req.originalUrl.startsWith("/api/")) {
        return res.sendFile(indexPath);
    }
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---------------------------------------------------------------------------
// Ensure news_events.timestamp column exists (run once on startup if DATABASE_URL set)
// Uses direct Postgres; set DATABASE_URL in backend/.env from Supabase Dashboard > Project Settings > Database > Connection string (URI)
// ---------------------------------------------------------------------------
async function ensureTimestampColumn() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    const client = new PgClient({ connectionString: databaseUrl });
    try {
        await client.connect();
        await client.query(`
            ALTER TABLE news_events
            ADD COLUMN IF NOT EXISTS timestamp timestamptz,
            ADD COLUMN IF NOT EXISTS location_label text;
        `);
        await client.query(`
            UPDATE news_events
            SET timestamp = created_at
            WHERE timestamp IS NULL AND created_at IS NOT NULL;
        `);
        await client.query(`
            UPDATE news_events
            SET timestamp = now()
            WHERE timestamp IS NULL;
        `);
        console.log("[GeoNews] news_events.timestamp and location_label columns ensured");
    } catch (err) {
        console.warn("[GeoNews] Could not ensure timestamp column:", err.message);
    } finally {
        await client.end().catch(() => {});
    }
}

// ---------------------------------------------------------------------------
// Server startup + graceful shutdown
// ---------------------------------------------------------------------------
let server;

async function startServer() {
    if (supabase && process.env.DATABASE_URL) {
        await ensureTimestampColumn();
    }

    // Load DistilBERT QA model for country inference (pull on first run)
    try {
        const { pipeline } = await import("@xenova/transformers");
        qaPipeline = await pipeline("question-answering", "Xenova/distilbert-base-uncased-distilled-squad");
        console.log("[GeoNews] DistilBERT QA model loaded (country inference)");
    } catch (err) {
        console.warn("[GeoNews] DistilBERT QA model not loaded:", err.message);
    }

    // Startup connectivity check
    if (supabase) {
        try {
            const { count, error } = await supabase
                .from("news_events")
                .select("*", { count: "exact", head: true });
            if (error) throw error;
            console.log(`[GeoNews] Supabase connected - ${count} news events in database`);
        } catch (err) {
            console.warn("[GeoNews] Supabase connectivity check failed:", err.message);
        }
    }

    // Auto-sync fresh news on startup if NewsAPI + Supabase are configured
    if (supabase && process.env.NEWS_API_KEY) {
        syncNewsFromAPI()
            .then((r) => console.log(`[GeoNews] Startup sync: ${r.synced} synced, ${r.enriched} enriched`))
            .catch((err) => console.warn("[GeoNews] Startup sync failed (non-critical):", err.message));
    }

    server = app.listen(PORT, () => {
        console.log(`\n[GeoNews] Server v2.0.0 running on http://localhost:${PORT}`);
        console.log(`[GeoNews] Supabase: ${supabase ? "connected" : "not configured (static fallback)"}`);
        console.log(`[GeoNews] NewsAPI:  ${process.env.NEWS_API_KEY ? "configured" : "not configured"}`);
        console.log(`[GeoNews] Groq AI:  ${process.env.GROQ_API_KEY ? "configured" : "not configured"}\n`);
    });
}

function shutdown(signal) {
    console.log(`\n[GeoNews] ${signal} received, shutting down gracefully...`);
    if (server) {
        server.close(() => {
            console.log("[GeoNews] Server closed.");
            process.exit(0);
        });
        // Force close after 5s
        setTimeout(() => process.exit(1), 5000);
    } else {
        process.exit(0);
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
    console.error("[GeoNews] Unhandled promise rejection:", reason);
});

startServer();
