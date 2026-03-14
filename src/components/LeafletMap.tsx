import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NewsItem } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  Geopolitics: '#ff4d4d',
  Business:    '#f1c40f',
  Technology:  '#00d4ff',
  Climate:     '#2ecc71',
};

function makeLocationPinSvg(color: string, size: number): string {
  const h = Math.round(size * 1.5);
  const cx = size / 2;
  const r = Math.round(size * 0.4);
  const innerR = Math.round(r * 0.45);
  return `<svg width="${size}" height="${h}" viewBox="0 0 ${size} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow_${color.replace('#','')}" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
      </radialGradient>
      <filter id="shadow_${color.replace('#','')}" x="-40%" y="-20%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${color}" flood-opacity="0.5"/>
      </filter>
    </defs>
    <path d="M${cx} ${h - 2} C${cx} ${h - 2} ${size - 2} ${r + 4} ${size - 2} ${r + 2} C${size - 2} ${2} ${2} ${2} ${2} ${r + 2} C${2} ${r + 4} ${cx} ${h - 2} ${cx} ${h - 2}Z"
      fill="url(#glow_${color.replace('#','')})" filter="url(#shadow_${color.replace('#','')})"/>
    <path d="M${cx} ${h - 2} C${cx} ${h - 2} ${size - 2} ${r + 4} ${size - 2} ${r + 2} C${size - 2} ${2} ${2} ${2} ${2} ${r + 2} C${2} ${r + 4} ${cx} ${h - 2} ${cx} ${h - 2}Z"
      fill="none" stroke="white" stroke-opacity="0.3" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${r + 2}" r="${innerR}" fill="white" fill-opacity="0.9"/>
  </svg>`;
}

function createLocationIcon(color: string, importance: number): L.DivIcon {
  const size = importance >= 4 ? 28 : 22;
  const h = Math.round(size * 1.5);
  return L.divIcon({
    html: `<div class="geo-leaflet-pin" style="width:${size}px;height:${h}px;filter:drop-shadow(0 2px 8px ${color}aa);transition:filter 0.25s ease,transform 0.25s ease">${makeLocationPinSvg(color, size)}</div>`,
    className: '',
    iconSize: [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor: [0, -h],
  });
}

interface LeafletMapViewProps {
  center: { lat: number; lng: number } | null;
  zoom: number;
  news: NewsItem[];
  onBoundsChange: (bounds: any, zoom: number) => void;
  onMarkerClick: (item: NewsItem) => void;
}

function CenterController({
  center,
  zoom
}: {
  center: { lat: number; lng: number } | null;
  zoom: number;
}) {
  const map = useMap();
  const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!center || (prevCenterRef.current?.lat === center.lat && prevCenterRef.current?.lng === center.lng)) return;
    prevCenterRef.current = center;
    const effectiveZoom = Math.max(3, Math.min(16, zoom));
    map.flyTo([center.lat, center.lng], effectiveZoom);
  }, [center, zoom, map]);

  return null;
}

function BoundsReporter({ onBoundsChange }: { onBoundsChange: (bounds: any, zoom: number) => void }) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds();
      const boundsProxy = {
        getNorth: () => b.getNorth(),
        getSouth: () => b.getSouth(),
        getEast: () => b.getEast(),
        getWest: () => b.getWest(),
        getCenter: () => map.getCenter()
      };
      onBoundsChange(boundsProxy, map.getZoom());
    },
    zoomend() {
      const b = map.getBounds();
      const boundsProxy = {
        getNorth: () => b.getNorth(),
        getSouth: () => b.getSouth(),
        getEast: () => b.getEast(),
        getWest: () => b.getWest(),
        getCenter: () => map.getCenter()
      };
      onBoundsChange(boundsProxy, map.getZoom());
    }
  });
  return null;
}

export default function LeafletMapView({
  center,
  zoom,
  news,
  onBoundsChange,
  onMarkerClick
}: LeafletMapViewProps) {
  const centerCoord: LatLngExpression = center ? [center.lat, center.lng] : [0, 0];
  const effectiveZoom = Math.max(3, Math.min(16, zoom));

  // Ensure Leaflet container respects our dark background beneath tiles
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.classList.add('leaflet-root-mounted');
    }
    return () => {
      if (root) {
        root.classList.remove('leaflet-root-mounted');
      }
    };
  }, []);

  return (
    <MapContainer
      {...({
        center: centerCoord,
        zoom: effectiveZoom,
        minZoom: 2,
        maxZoom: 18,
        style: { width: '100%', height: '100%' },
        zoomControl: false,
        attributionControl: false
      } as React.ComponentProps<typeof MapContainer>)}
    >
      {/* Base layer: CartoDB Voyager tiles (free, English labels) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />

      {/* Location pin markers with glassmorphism popup */}
      {news.map((item) => {
        const color = CATEGORY_COLORS[item.category] ?? '#aaaaaa';
        return (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            {...({ icon: createLocationIcon(color, item.importance) } as any)}
            eventHandlers={{
              click: () => onMarkerClick(item),
              mouseover: (e) => {
                const el = (e.target as L.Marker).getElement();
                if (el) {
                  const pin = el.querySelector('.geo-leaflet-pin') as HTMLElement | null;
                  if (pin) {
                    pin.style.filter = `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color}88)`;
                    pin.style.transform = 'scale(1.3)';
                  }
                }
              },
              mouseout: (e) => {
                const el = (e.target as L.Marker).getElement();
                if (el) {
                  const pin = el.querySelector('.geo-leaflet-pin') as HTMLElement | null;
                  if (pin) {
                    pin.style.filter = `drop-shadow(0 2px 8px ${color}aa)`;
                    pin.style.transform = 'scale(1)';
                  }
                }
              },
            }}
          >
            <Popup {...({ className: 'glass-popup', closeButton: false } as any)}>
              <div style={{ minWidth: 200, maxWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
                    {item.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 8 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  <span style={{ color: color, fontWeight: 600 }}>Strategic Impact: </span>
                  {item.soWhat || item.summary}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <CenterController center={center} zoom={effectiveZoom} />
      <BoundsReporter onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
}

