# GEO_NEWS_UNIHACK — Change Log

## Session: March 14, 2026

---

### 1. `backend/server.js` — Major Overhaul

#### Environment & Config
- Added `path` module and changed `require("dotenv").config()` to use `__dirname`-relative path so the backend reads `backend/.env` correctly regardless of working directory.
- Added SQL comments at the top for two new required Supabase tables: `risk_indices` and `ai_forecasts`.

#### Supabase Column Mapping Fixes (Bug Fix)
The `/api/news` and `/api/news/all` routes were mapping wrong column names from Supabase rows:
| Wrong (old) | Correct (new) |
|---|---|
| `row.content` | `row.summary` |
| `row.long` | `row.lng` |
| `row.impact_score` | `row.importance` |
| `row.content` for soWhat | `row.so_what` |
| hardcoded `'GeoNews'` source | `row.source` |
| hardcoded empty `url` | `row.url` |
| hardcoded `new Date()` timestamp | `row.timestamp \|\| row.created_at` |
| ignored `personalized_impact` | `row.personalized_impact` |

#### `/api/sync/needed` — Smart Cache Invalidation
- Replaced the dummy row-count proxy with a real `created_at` timestamp comparison.
- Returns `{ needed: true }` only when the newest article is older than **30 minutes**.

#### New Endpoint: `GET /api/risk-indices`
- Reads the latest 4 rows (one per category) from the `risk_indices` Supabase table.
- Used by the Strategic Dashboard to display live AI risk assessments.

#### New Endpoint: `POST /api/risk-indices`
- Accepts a `{ forecasts: RiskIndex[] }` body and upserts by `category`.

#### New Endpoint: `POST /api/generate-forecasts`
- Pulls the latest 10 news rows from `news_events`.
- Sends them to **Groq** (`llama-3.1-8b-instant`) asking for Strategic Risk Level (1-100) and 48-hour forecasts for all 4 categories.
- Parses the JSON response and saves it to both `risk_indices` (upsert) and `ai_forecasts` (append history).

#### New Endpoint: `POST /api/chat`
- Proxies chat messages to Groq, keeping `GROQ_API_KEY` off the client bundle.
- Used by the CommandAssistant component.

---

### 2. `backend/.env`

- Added `GROQ_API_KEY=gsk_...` so the new `/api/generate-forecasts` and `/api/chat` endpoints work.

---

### 3. `src/services/newsService.ts` — New Exports

Added two new exported functions:

#### `fetchAndStoreNews()`
- Triggers a NewsAPI → Supabase sync via the backend `POST /api/sync`.
- Thin wrapper around existing `syncLatestNews()` so external code can call it with a meaningful name.

#### `fetchNewsFromSupabase(interests?)`
- Fetches all stored news from Supabase via the backend (the fast "from cache" path — no NewsAPI hit).
- Thin wrapper around existing `fetchAllNews()`.
- Fixes the `"does not provide an export named 'fetchNewsFromSupabase'"` runtime crash in `App.tsx`.

#### Bug Fix
- Replaced `⚠️` emoji in deepResearch error string with `[OFFLINE]` to fix a Unicode encoding compile error (`U+26a0`).

---

### 4. `src/services/aiService.ts` — New File

Created a dedicated AI service module with:

```typescript
interface RiskIndex {
  category: string;
  region: string;
  risk_level: number;         // 1-100
  label: string;              // e.g. "Regional Volatility: Red Sea"
  level_label: 'Low' | 'Moderate' | 'High' | 'Severe';
  forecast: string;           // 48-hour forecast text
  so_what: string;            // plain English summary
}
```

**`generateRegionalForecasts()`**
- Calls `POST /api/generate-forecasts` on the backend.
- Returns fresh AI-generated risk assessments saved to Supabase.

**`fetchRiskIndices()`**
- Calls `GET /api/risk-indices` — fast read from cache, no AI call.
- Used on Strategic Dashboard open to load existing data instantly.

---

### 5. `src/components/CommandAssistant.tsx` — Groq AI Integration

#### Replaced static FAQ bot with live Groq AI

- Added `onNavigateTo` prop (`(coords: { lat, lng, zoom? }) => void`) alongside existing `onCenterOnCountry`.
- Added `askGroq()` async function that:
  1. Sends user message + system prompt to `POST /api/chat` backend proxy.
  2. System prompt instructs Groq to return a `{"action":"flyTo","lat":...,"lng":...}` JSON object when the user asks to navigate somewhere.
  3. Falls back to local FAQ + `getCountryFromPhrase()` if the backend is unreachable.
- `handleSend` is now `async`; shows "AI is typing..." while awaiting Groq.
- Auto-scrolls chat to latest message via `useRef` + `useEffect`.
- Coordinates `flyTo` responses trigger `onNavigateTo` which calls `setCenterOn` in `App.tsx`, moving the globe/map camera.

**System prompt capabilities told to Groq:**
- GeoNews features (3D globe, 2D Leaflet switch, categories, markers, Strategic Dashboard).
- Navigation commands: any "show me / take me to / fly to / zoom to [place]" triggers a `flyTo` response.

---

### 6. `src/components/StrategicDashboard.tsx` — Live Data from Supabase

#### Replaced all static hardcoded data with live `risk_indices` table reads

- Added `useState` + `useEffect` to call `fetchRiskIndices()` on mount.
- If the table is empty, automatically triggers `generateRegionalForecasts()` in the background.
- Added a **Refresh button** (↻ icon) that calls `generateRegionalForecasts()` on demand to regenerate forecasts from the latest 10 news items.
- Added a `Loader2` spinner in the header while loading.
- **Static fallback** (`STATIC_FALLBACK` object): if Supabase has no data and Groq is unreachable, the original hardcoded values are shown — dashboard is never empty.
- Separated visual styling metadata (`PILLAR_META`) from live data so the card layout/colours are never dependent on the database schema.

---

### 7. `src/App.tsx` — Wire `onNavigateTo`

- Passed `onNavigateTo={(coords) => setCenterOn(coords)}` to `<CommandAssistant>` so Groq-generated coordinates move the globe/map camera.

---

### 8. `src/services/countryCoordinates.ts` — Encoding Fix

- Replaced `→` (U+2192) arrow in a JSDoc comment with `->` to fix a pre-existing TypeScript compile warning.

---

## Architecture: Caching & Sync Strategy

```
Browser load
    │
    ├─► fetchRiskIndices()         ← read risk_indices (instant, no AI)
    │       └─► if empty → generateRegionalForecasts() [background]
    │
    ├─► isSyncNeeded()             ← check if newest news_event is >30 min old
    │       └─► if yes → syncLatestNews() → NewsAPI → Supabase upsert
    │
    └─► fetchAllNews()             ← read news_events (instant from Supabase)
            └─► fallback: static historical_news.json

User asks CommandAssistant "Show me Taiwan"
    │
    └─► POST /api/chat (backend Groq proxy)
            └─► Groq returns { "action":"flyTo","lat":25.03,"lng":121.56 }
                    └─► globe.pointOfView() / map.flyTo() called
```

**Key principle:** NewsAPI is only hit once per 30-minute window across all users. Everyone else reads from Supabase. First visitor of the day pays the API cost; all subsequent visitors get instant loads.

---

## New Supabase Tables Required

Run once in the Supabase SQL editor:

```sql
create table if not exists risk_indices (
  id          bigint generated always as identity primary key,
  category    text unique not null,
  region      text,
  risk_level  int,
  label       text,
  level_label text,
  forecast    text,
  so_what     text,
  created_at  timestamptz default now()
);

create table if not exists ai_forecasts (
  id           bigint generated always as identity primary key,
  category     text,
  region       text,
  risk_level   int,
  forecast_text text,
  so_what      text,
  created_at   timestamptz default now()
);
```
