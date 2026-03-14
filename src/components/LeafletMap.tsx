import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NewsItem } from '../types';

type CircleMarkerProps = React.ComponentProps<typeof CircleMarker>;

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

      {/* Feature layer: news markers as hollow glowing rings */}
      {news.map((item) => (
        <CircleMarker
          key={item.id}
          center={[item.lat, item.lng]}
          pathOptions={{
            color: '#00f0ff',
            weight: 2,
            fillOpacity: 0
          }}
          eventHandlers={{
            click: () => onMarkerClick(item)
          }}
          {...({ radius: 8 } as Partial<CircleMarkerProps>)}
        />
      ))}

      <CenterController center={center} zoom={effectiveZoom} />
      <BoundsReporter onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
}

