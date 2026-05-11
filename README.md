# GeoNews — Intelligence HUD

**Real-time global news visualization with AI-driven geopolitical intelligence.**

---

## Project Description

**GeoNews** is an intelligence-grade news command center that maps world events onto a live 3D globe and 2D Leaflet map. Filter by sector, explore heatmaps, receive proximity alerts, search any event, and deep-dive with AI-generated causality reports — all inside a dark, glassmorphic HUD interface.

---

## Tech Stack

| Category        | Technologies |
|----------------|--------------|
| **Framework**  | React 19, TypeScript |
| **Build**      | Vite 6 |
| **Styling**    | Tailwind CSS v4, Space Grotesk, JetBrains Mono |
| **3D Globe**   | Three.js, react-globe.gl |
| **2D Maps**    | Leaflet, react-leaflet, leaflet.heat |
| **Animation**  | Motion (Framer Motion-compatible) |
| **Icons**      | Lucide React |
| **Backend**    | Express 4, Supabase, NewsAPI, Groq LLM |
| **AI Models**  | Groq `llama-3.1-8b-instant`, `llama-3.2-11b-vision-preview` |
| **DB**         | Supabase (PostgreSQL) |

---

## Key Features

- **3D Interactive Globe** — Spin the Earth, zoom from global to local. Seamless switch to a 2D Leaflet map at higher zoom. News markers coloured by category and importance.
- **Intelligence Feed** — Right-side timeline panel with live headlines, critical-alert tagging, and timeline dot indicators. Updates based on your current map region.
- **Left Icon Dock** — Permanent icon dock (Geo / Clim / Econ / Tech) for instant category switching. Expands into a filter drawer with signal filters, map layers, and temporal filter.
- **Density & Sentiment Heatmaps** — Toggle info-density or positive/negative sentiment overlays on both the Leaflet map (`leaflet.heat`) and 3D globe (hex bins).
- **Proximity Alerts** — Bell icon with badge count alerts you when high-impact news falls near your tracked interests or routes.
- **Global Search** — Floating search bar (`/` keyboard shortcut) with 300ms debounce. Click a result to fly the map and open the detail panel.
- **Analytics Dashboard** — `// ANALYTICS` panel with sector tabs, regional volatility bars, and AI-grounded 48-hour risk forecasts.
- **Deep Research** — AI intelligence reports per article: historical context, ripple effects, risk assessment, and strategic outlook (Groq).
- **Image Analysis** — Upload any image for geopolitical context via Groq vision model.
- **User Interests** — Add/remove tracked points and trade routes. Persisted to Supabase (falls back to localStorage).
- **Command Assistant** — AI chat panel (terminal FAB, bottom-right) for map navigation, news summaries, and FAQ.
- **HUD Design System** — `#0c0f0f` background, `#00F5FF` cyan accent, Space Grotesk wordmark, glass panels, scanline overlay, pulse-ring status indicators, and bottom status bar.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommend 20+)
- **npm**

### 1. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
```

### 2. Configure environment

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
NEWS_API_KEY=your-newsapi-key
GROQ_API_KEY=your-groq-key
# Optional - enables direct Postgres migrations:
DATABASE_URL=postgresql://...
```

### 3. Run

```bash
# Terminal 1 - Frontend
npm run dev          # http://localhost:3000

# Terminal 2 - Backend
node backend/server.js   # http://localhost:5001
```

### Other commands

```bash
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # TypeScript check (tsc --noEmit)
```

---

## Supabase Setup

Run these once in the **Supabase SQL Editor**:

```sql
-- Risk index table
create table if not exists risk_indices (
  id bigint generated always as identity primary key,
  category text unique,
  region text, risk_level int,
  label text, level_label text,
  forecast text, so_what text,
  created_at timestamptz default now()
);

-- AI forecast history
create table if not exists ai_forecasts (
  id bigint generated always as identity primary key,
  category text, region text, risk_level int,
  forecast_text text, so_what text,
  created_at timestamptz default now()
);

-- User interests (tracked locations and routes)
create table if not exists user_interests (
  id text primary key,
  user_id text not null,
  name text not null, type text not null,
  lat double precision, lng double precision,
  radius int, coords jsonb,
  created_at timestamptz default now()
);
create index if not exists user_interests_user_id_idx on user_interests(user_id);
```

Without `user_interests`, interests still persist via browser `localStorage`.

---

## Project Structure

```
src/
+-- App.tsx                  # Root: HUD layout, news state, filters, alerts, deep research
+-- index.css                # HUD design system: glass, pulse-cyan, nebula-bg, timeline-line
+-- types.ts                 # NewsCategory, NewsItem, TrendAnalysis, UserInterest
+-- components/
|   +-- Map.tsx              # 3D Globe (react-globe.gl) + hex-bin heatmap + Leaflet switch
|   +-- LeafletMap.tsx       # 2D Leaflet map with leaflet.heat density/sentiment overlays
|   +-- NavigationHub.tsx    # Icon dock, filter drawer, analytics toggle, alerts dropdown
|   +-- HeadlinesTicker.tsx  # Intelligence Feed panel (right sidebar, timeline UI)
|   +-- SearchPanel.tsx      # Floating search bar with keyboard shortcut + result navigation
|   +-- CommandAssistant.tsx # AI chat FAB (Groq-powered, fly-to commands)
|   +-- StrategicDashboard.tsx # Analytics board with risk indices and forecasts
|   +-- CloudTransitionOverlay.tsx
|   +-- Layout.tsx
|   \-- Navbar.tsx
+-- services/
|   +-- newsService.ts       # fetchNews, searchNews, analyzeTrends, analyzeImage, interests
|   \-- countryCoordinates.ts
\-- data/
    \-- historical_news.json # Fallback sample data
backend/
+-- server.js                # Express API: news, sync, chat, trends, analyze-image, interests
+-- countryCoords.js         # Country code -> lat/lng + name -> code mappings
\-- package.json
```

---

Built for **UNIHACK** — where geography meets intelligence.
