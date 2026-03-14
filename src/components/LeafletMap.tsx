import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { NewsItem } from '../types';

interface LeafletMapProps {
  center: { lat: number; lng: number } | null;
  zoom: number;
  news: NewsItem[];
  onBoundsChange: (bounds: any, zoom: number) => void;
  onMarkerClick: (item: NewsItem) => void;
}

function BoundsReporter({ onBoundsChange }: { onBoundsChange: (bounds: any, zoom: number) => void }) {
  useMapEvents({
    moveend(map) {
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

export default function LeafletMap({ center, zoom, news, onBoundsChange, onMarkerClick }: LeafletMapProps) {
  const effectiveCenter = center ?? { lat: 0, lng: 0 };
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
      center={[effectiveCenter.lat, effectiveCenter.lng]}
      zoom={effectiveZoom}
      minZoom={2}
      maxZoom={18}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* Base layer: CartoDB Voyager tiles (free, English labels) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />

      {/* Feature layer: news markers as hollow glowing rings */}
      {news.map((item) => (
        <CircleMarker
          key={item.id}
          center={[item.lat, item.lng]}
          radius={8}
          pathOptions={{
            color: '#00f0ff',
            weight: 2,
            fillOpacity: 0,
          }}
          eventHandlers={{
            click: () => onMarkerClick(item),
          }}
        />
      ))}

      <BoundsReporter onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
}
