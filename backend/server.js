const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { createClient } = require("@supabase/supabase-js");

// ---------------------------------------------------------------------------
// Required additional tables - run once in Supabase SQL editor:
//
//   create table if not exists risk_indices (
//     id          bigint generated always as identity primary key,
//     category    text unique not null,
//     region      text,
//     risk_level  int,
//     label       text,
//     level_label text,
//     forecast    text,
//     so_what     text,
//     created_at  timestamptz default now()
//   );
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

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Supabase client (server-side, uses service role key)
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
//
// SQL to create the table in Supabase (run once in the SQL editor):
//
//   create table if not exists news_events (
//     id          bigint generated always as identity primary key,
//     title       text        not null,
//     summary     text,
//     so_what     text,
//     personalized_impact text,
//     source      text,
//     url         text unique,
//     category    text,
//     lat         double precision,
//     lng         double precision,
//     timestamp   timestamptz default now(),
//     importance  int         default 3,
//     sentiment   text        default 'Neutral',
//     created_at  timestamptz default now()
//   );
//
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
// Country code -> representative coordinates (for NewsAPI geocoding)
// ---------------------------------------------------------------------------
const COUNTRY_COORDS = {
  ae: { lat: 24.47, lng: 54.37 },
  ar: { lat: -34.6, lng: -58.38 },
  at: { lat: 48.21, lng: 16.37 },
  au: { lat: -33.87, lng: 151.21 },
  be: { lat: 50.85, lng: 4.35 },
  bg: { lat: 42.7, lng: 23.32 },
  br: { lat: -15.79, lng: -47.88 },
  ca: { lat: 45.42, lng: -75.69 },
  ch: { lat: 46.95, lng: 7.45 },
  cn: { lat: 39.91, lng: 116.39 },
  co: { lat: 4.71, lng: -74.07 },
  cz: { lat: 50.09, lng: 14.42 },
  de: { lat: 52.52, lng: 13.4 },
  eg: { lat: 30.06, lng: 31.25 },
  fr: { lat: 48.85, lng: 2.35 },
  gb: { lat: 51.51, lng: -0.12 },
  gr: { lat: 37.98, lng: 23.73 },
  hk: { lat: 22.32, lng: 114.17 },
  hu: { lat: 47.5, lng: 19.04 },
  id: { lat: -6.21, lng: 106.85 },
  ie: { lat: 53.33, lng: -6.25 },
  il: { lat: 31.77, lng: 35.22 },
  in: { lat: 28.61, lng: 77.21 },
  it: { lat: 41.9, lng: 12.49 },
  jp: { lat: 35.68, lng: 139.69 },
  kr: { lat: 37.57, lng: 126.98 },
  lt: { lat: 54.69, lng: 25.28 },
  lv: { lat: 56.95, lng: 24.11 },
  ma: { lat: 33.99, lng: -6.85 },
  mx: { lat: 19.43, lng: -99.13 },
  my: { lat: 3.15, lng: 101.69 },
  ng: { lat: 9.07, lng: 7.4 },
  nl: { lat: 52.37, lng: 4.9 },
  no: { lat: 59.91, lng: 10.75 },
  nz: { lat: -41.29, lng: 174.78 },
  ph: { lat: 14.6, lng: 120.98 },
  pl: { lat: 52.23, lng: 21.01 },
  pt: { lat: 38.72, lng: -9.14 },
  ro: { lat: 44.43, lng: 26.1 },
  rs: { lat: 44.8, lng: 20.46 },
  ru: { lat: 55.75, lng: 37.62 },
  sa: { lat: 24.69, lng: 46.72 },
  se: { lat: 59.33, lng: 18.07 },
  sg: { lat: 1.35, lng: 103.82 },
  si: { lat: 46.05, lng: 14.51 },
  sk: { lat: 48.15, lng: 17.11 },
  th: { lat: 13.75, lng: 100.5 },
  tr: { lat: 39.93, lng: 32.86 },
  tw: { lat: 25.03, lng: 121.56 },
  ua: { lat: 50.45, lng: 30.52 },
  us: { lat: 38.89, lng: -77.04 },
  ve: { lat: 10.49, lng: -66.88 },
  za: { lat: -25.74, lng: 28.19 },
};

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

/** Map a NewsAPI article to a 2-letter country code for geolocation. */
function detectCountry(article) {
  const sourceName = (article.source?.name || "").toLowerCase();
  if (SOURCE_COUNTRY_MAP[sourceName]) return SOURCE_COUNTRY_MAP[sourceName];
  // Keyword scan on title for common place names
  const title = (article.title || "").toLowerCase();
  if (/\bukraine\b/.test(title)) return "ua";
  if (/\brussia\b/.test(title)) return "ru";
  if (/\bchina\b|\bchinese\b/.test(title)) return "cn";
  if (/\biran\b|\bteheran\b/.test(title)) return "ir";
  if (/\bisrael\b|\bgaza\b/.test(title)) return "il";
  if (/\bindian?\b/.test(title)) return "in";
  if (/\bjapan\b|\bjapanese\b/.test(title)) return "jp";
  if (/\bgermany\b|\bgerman\b/.test(title)) return "de";
  if (/\bfrance\b|\bfrench\b/.test(title)) return "fr";
  if (/\buk\b|\bbritain\b|\bbritish\b/.test(title)) return "gb";
  if (/\baustralia\b|\baustralian\b/.test(title)) return "au";
  if (/\bcanada\b|\bcanadian\b/.test(title)) return "ca";
  if (/\bbrazil\b|\bbrazilian\b/.test(title)) return "br";
  if (/\bsouth korea\b|\bkorean\b/.test(title)) return "kr";
  if (/\bsaudi arabia\b|\briyadh\b/.test(title)) return "sa";
  if (/\bsingapore\b/.test(title)) return "sg";
  if (/\bturkey\b|\bturkish\b|\bandkara\b/.test(title)) return "tr";
  if (/\bpoland\b|\bpolish\b/.test(title)) return "pl";
  if (/\bgreece\b|\bgreek\b/.test(title)) return "gr";
  if (/\bromania\b|\bbucharest\b/.test(title)) return "ro";
  if (/\bnigeria\b|\blagos\b/.test(title)) return "ng";
  if (/\bsouth africa\b/.test(title)) return "za";
  return "us"; // fallback
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
// Sync: fetch from NewsAPI and upsert into Supabase
// ---------------------------------------------------------------------------
async function syncNewsFromAPI() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("[GeoNews] NEWS_API_KEY not set - skipping NewsAPI sync.");
    return;
  }
  if (!supabase) {
    console.warn("[GeoNews] Supabase not configured - skipping sync.");
    return;
  }

  const categories = ["business", "technology", "general", "science", "health"];
  const allArticles = [];

  for (const cat of categories) {
    try {
      const url =
        `https://newsapi.org/v2/top-headlines` +
        `?category=${cat}&language=en&pageSize=20&apiKey=${apiKey}`;
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

  const rows = allArticles
    .filter((a) => a.title && a.title !== "[Removed]" && a.url)
    .map((a) => {
      const country = detectCountry(a);
      const coords = COUNTRY_COORDS[country] || COUNTRY_COORDS["us"];
      // Small jitter so pins from same country don't stack exactly
      const jitter = () => (Math.random() - 0.5) * 1.5;
      return {
        title: a.title,
        // Map to actual DB column names (content / long / impact_score)
        content: a.description || a.title,
        category: CATEGORY_MAP[a._cat] || "Geopolitics",
        lat: coords.lat + jitter(),
        long: coords.lng + jitter(),
        impact_score: inferImportance(a),
        sentiment: inferSentiment(a.title),
      };
    });

  if (rows.length === 0) {
    console.log("[GeoNews] No articles to upsert.");
    return;
  }

  const { error } = await supabase
    .from("news_events")
    .upsert(rows, { onConflict: "title", ignoreDuplicates: true });

  if (error) {
    console.error("[GeoNews] Supabase upsert error:", error.message);
    throw error;
  }

  console.log(`[GeoNews] Synced ${rows.length} articles to Supabase.`);
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
    res.send("Backend is running");
});

// ---------------------------------------------------------------------------
// GET /api/news - fetch from Supabase (with static fallback)
// ---------------------------------------------------------------------------
app.get("/api/news", async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const zoom = Number(req.query.zoom || 3);
    const category = req.query.category;

    // Try Supabase first
    if (supabase) {
        try {
            let query = supabase
                .from("news_events")
                .select("*")
                .order("id", { ascending: false })
                .limit(200);

            if (category && category !== "Just In" && category !== "For You") {
                query = query.eq("category", category);
            }

            const { data, error } = await query;
            if (error) throw error;

            let results = (data || []).map((row) => ({
                id: String(row.id),
                title: row.title,
                // Handle both old column names (content/long/impact_score) and new schema
                summary: row.summary || row.content || row.title,
                soWhat: row.so_what || '',
                personalizedImpact: row.personalized_impact || undefined,
                source: row.source || 'GeoNews',
                url: row.url || '',
                category: row.category,
                lat: row.lat,
                lng: row.lng ?? row.long,
                timestamp: row.timestamp || row.created_at || new Date().toISOString(),
                importance: row.importance ?? row.impact_score ?? 3,
                sentiment: row.sentiment || 'Neutral',
            }));

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
// POST /api/sync - trigger a NewsAPI -> Supabase sync
// ---------------------------------------------------------------------------
app.post("/api/sync", async (req, res) => {
    try {
        await syncNewsFromAPI();
        res.json({ ok: true, message: "Sync completed" });
    } catch (err) {
        res.status(500).json({ ok: false, error: String(err.message) });
    }
});

// ---------------------------------------------------------------------------
// GET /api/news/all - fetch everything from Supabase without geo-filtering
// Used for initial global map population
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

            const results = (data || []).map((row) => ({
                id: String(row.id),
                title: row.title,
                // Handle both old column names (content/long/impact_score) and new schema
                summary: row.summary || row.content || row.title,
                soWhat: row.so_what || '',
                personalizedImpact: row.personalized_impact || undefined,
                source: row.source || 'GeoNews',
                url: row.url || '',
                category: row.category,
                lat: row.lat,
                lng: row.lng ?? row.long,
                timestamp: row.timestamp || row.created_at || new Date().toISOString(),
                importance: row.importance ?? row.impact_score ?? 3,
                sentiment: row.sentiment || 'Neutral',
            }));

            return res.json(results);
        } catch (err) {
            console.error("[GeoNews] /api/news/all Supabase error, using static fallback:", err.message);
        }
    }
    // Static fallback
    res.json(newsData);
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

        const lastSync = new Date(data.created_at).getTime();
        const needed = Date.now() - lastSync > THIRTY_MINUTES_MS;
        res.json({ needed });
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
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: "GROQ_API_KEY not configured" });

    try {
        const { data: newsRows, error } = await supabase
            .from("news_events")
            .select("title, category, sentiment")
            .order("id", { ascending: false })
            .limit(10);
        if (error) throw error;
        if (!newsRows?.length) return res.json({ ok: true, forecasts: [] });

        const newsContext = newsRows
            .map((n, i) => `${i + 1}. [${n.category}] ${n.title} (sentiment: ${n.sentiment})`)
            .join("\n");

        const prompt = `You are a geopolitical risk analyst. Based on these ${newsRows.length} recent news events:\n${newsContext}\n\nGenerate a JSON array of exactly 4 regional risk assessments, one for each: Geopolitics, Climate, Economy, Technology.\nEach object: { region: string, category: string, risk_level: number (1-100), label: string (e.g. \'Regional Volatility: Red Sea\'), level_label: string (Low|Moderate|High|Severe), forecast: string (48h, 1-2 sentences), so_what: string (plain English, 1-2 sentences) }\nReturn ONLY valid JSON array, no markdown, no explanation.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are a geopolitical risk analyst. Return only valid JSON array." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.6,
                max_tokens: 1024,
            }),
        });

        if (!groqRes.ok) throw new Error(`Groq API error: ${groqRes.status}`);
        const groqData = await groqRes.json();
        const rawContent = groqData.choices?.[0]?.message?.content || "";

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
// Keeps GROQ_API_KEY off the client bundle
// ---------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: "GROQ_API_KEY not configured" });

    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "messages required" });

    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages,
                temperature: 0.5,
                max_tokens: 300,
            }),
        });
        if (!groqRes.ok) throw new Error(`Groq error: ${groqRes.status}`);
        const data = await groqRes.json();
        res.json({ content: data.choices?.[0]?.message?.content || "" });
    } catch (err) {
        console.error("[GeoNews] /api/chat error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
