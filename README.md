
# # GeoNews — UNIHACK

**Real-time global news visualization with AI-driven insights.**

---

## Project Description

**GeoNews** brings world news onto a 3D globe. Explore stories by geography, filter by sector and signal type, and drill into AI-powered “So What?” summaries and deep research—all in a single, immersive interface. Whether you’re tracking geopolitics, climate, business, or tech, GeoNews turns the map into your command center.

---

## Tech Stack

| Category        | Technologies |
|----------------|--------------|
| **Framework**  | React 19, TypeScript |
| **Build**      | Vite 6 |
| **Styling**    | Tailwind CSS v4 |
| **3D Globe**   | Three.js, react-globe.gl |
| **2D Maps**    | Leaflet, react-leaflet |
| **Animation**  | Motion (Framer Motion–compatible) |
| **Icons**      | Lucide React |
| **Content**    | react-markdown |
| **AI**         | Google GenAI (optional / deep research) |

---

## Key Features

- **3D Interactive Globe** — Spin the Earth, zoom from global to local, and see news markers by importance and sentiment. Seamless switch to a 2D Leaflet map at higher zoom levels.
- **Navigation Hub** — Left-side drawer with sector selection (Geopolitics, Climate, Economy, Tech), signal filters (#Energy, #Shipping, etc.), and a temporal slider (Live → past 14 days). One-click “Set Filters” to sync the map.
- **Analytics Dashboard** — Central “// ANALYTICS” panel with sector tabs, regional volatility bars, vector risk heatmap, and neural-network-style forecasts with confidence scores.
- **Command Assistant UI** — Ready for an AI command bar / assistant (UI hook points in place; full integration optional).
- **News Detail Panel** — Click any marker to open a side panel with title, summary, “So What?” TL;DR, personalized impact, and optional deep research (e.g. local LLM/Ollama).
- **Themed Experience** — Dark theme, cyan accents, scanline overlay, and glassmorphism panels for a cohesive hackathon-ready look.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommend 20+)
- **npm** (or yarn/pnpm)

### Run locally

```bash
# Clone the repo (or navigate to the project folder)
cd GEO_NEWS_UNIHACK

# Install dependencies
npm install

# Start the dev server (http://localhost:3000)
npm run dev
```

Then open **http://localhost:3000** in your browser. The globe loads with sample data; use the left drawer to change sectors and filters, and the top-center button to open the Analytics dashboard.

### Other commands

```bash
npm run build    # Production build
npm run preview # Preview production build locally
npm run lint    # TypeScript check (tsc --noEmit)
```

---

## Project Structure

```
src/
├── App.tsx                 # Root app: NavigationHub, Map, news panel, loading toast, scanline
├── main.tsx                # React entry (createRoot + App)
├── index.css               # Global styles, Tailwind, theme vars, scanline/glitch keyframes
├── types.ts                # NewsCategory, NewsItem, TrendAnalysis, UserInterest
├── declarations.d.ts       # Module/type declarations
├── vite-env.d.ts           # Vite client types
├── components/
│   ├── Map.tsx             # 3D Globe (react-globe.gl) + zoom-based switch to Leaflet
│   ├── LeafletMap.tsx      # 2D map (react-leaflet) for regional/local view
│   ├── NavigationHub.tsx   # Branding, Analytics button, nav drawer (sectors, filters, temporal)
│   ├── Layout.tsx          # Layout wrapper (optional)
│   ├── Navbar.tsx          # Top nav (optional)
│   └── Sidebar.tsx         # Sidebar (optional)
├── services/
│   └── newsService.ts      # fetchNews, analyzeTrends, analyzeImage, deepResearch
└── data/
    └── historical_news.json # Sample news items with lat/lng, category, sentiment
```

---

Built for **UNIHACK** — where geography meets the news.
