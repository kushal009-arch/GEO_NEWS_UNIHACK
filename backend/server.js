const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

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
    res.send("Backend is running 🚀");
});

app.get("/api/news", (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const zoom = Number(req.query.zoom || 3);
    const category = req.query.category;

    let results = [...newsData];

    if (category && category !== "Just In" && category !== "For You") {
        results = results.filter((item) => item.category === category);
    }

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const radius = radiusByZoom(zoom);

        results = results.filter((item) => {
            const distance = distanceDegrees(item.lat, item.lng, lat, lng);
            return distance <= radius;
        });
    }

    res.json(results);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
