import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { NewsItem } from '../types';

interface LeafletMapProps {
  center: { lat: number; lng: number } | null;
  zoom: number;
  news: NewsItem[];
  onBoundsChange: (bounds: any, zoom: number) => void;
  onMarkerClick: (item: NewsItem) => void;
}

/** Report bounds and zoom in same scale as globe (2–12) so parent state is consistent. */
function BoundsReporter({ onBoundsChange }: { onBoundsChange: (bounds: any, zoom: number) => void }) {
  const map = useMap();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const report = () => {
    if (!isMountedRef.current) return;
    const b = map.getBounds();
    const boundsProxy = {
      getNorth: () => b.getNorth(),
      getSouth: () => b.getSouth(),
      getEast: () => b.getEast(),
      getWest: () => b.getWest(),
      getCenter: () => map.getCenter()
    };
    const leafletZoom = map.getZoom();
    const normalizedZoom = Math.max(2, Math.min(12, leafletZoom - 2));
    onBoundsChange(boundsProxy, normalizedZoom);
  };

  useMapEvents({
    moveend: report,
    zoomend: report
  });
  return null;
}

/** Sync map view when parent passes new center/zoom (so zoom level stays in sync). */
function SyncView({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export default function LeafletMap({ center, zoom, news, onBoundsChange, onMarkerClick }: LeafletMapProps) {
  const effectiveCenter = center ?? { lat: 0, lng: 0 };
  const effectiveZoom = Math.max(2, Math.min(18, zoom));

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
      <SyncView center={effectiveCenter} zoom={effectiveZoom} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />

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
