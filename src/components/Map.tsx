import { useEffect, useRef, useState, useMemo, memo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { NewsItem, UserInterest } from '../types';
import LeafletMap from './LeafletMap';

interface MapProps {
  news: NewsItem[];
  interests: UserInterest[];
  onBoundsChange: (bounds: any, zoom: number) => void;
  onMarkerClick: (item: NewsItem) => void;
  showHeatmap: boolean;
  showSentiment: boolean;
  /** When set, globe flies to this point (e.g. from Command Assistant "Take me to X"). */
  centerOn?: { lat: number; lng: number } | null;
  /** Called after centering so App can clear centerOn. */
  onCenterComplete?: () => void;
}

const cartoDbUrl = (x: number, y: number, l: number) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager/${l}/${x}/${y}.png`;

const getPointColor = (d: object) => {
  const item = d as NewsItem;

  if (item.sentiment === 'Negative' || item.sentiment === 'Panic') return '#ff4d4f';
  if (item.sentiment === 'Anxious') return '#facc15';
  if (item.sentiment === 'Positive' || item.sentiment === 'Celebratory') return '#22c55e';

  return '#00f0ff';
};

const getPointRadius = (d: object) => ((d as NewsItem).importance >= 4 ? 0.18 : 0.1);

const getPathPoints = (d: object) => (d as UserInterest).coords ?? [];
const getPathColor = () => 'rgba(0, 240, 255, 0.6)';

const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vNormal;
  void main() {
    float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
    float intensity = smoothstep(0.86, 1.0, rim);
    vec3 rimColor = mix(vec3(0.6, 0.9, 1.0), vec3(0.0, 0.94, 1.0), 0.6);
    gl_FragColor = vec4(rimColor, 0.55) * intensity;
  }
`;

const Map = memo(function Map({
  news,
  interests,
  onBoundsChange,
  onMarkerClick,
  showHeatmap,
  showSentiment,
  centerOn = null,
  onCenterComplete
}: MapProps) {
  const globeRef = useRef<any>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const starAnimationIdRef = useRef<number | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [altitudeGroup, setAltitudeGroup] = useState(3);
  const [uiZoom, setUiZoom] = useState(3);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!centerOn) return;
    const { lat, lng } = centerOn;
    const span = 25;
    const syntheticBounds = {
      getNorth: () => lat + span / 2,
      getSouth: () => lat - span / 2,
      getEast: () => lng + span / 2,
      getWest: () => lng - span / 2,
      getCenter: () => ({ lat, lng })
    };
    if (uiZoom >= 7) {
      setMapCenter(centerOn);
      onBoundsChange(syntheticBounds, 5);
      onCenterComplete?.();
      return;
    }
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.2 }, 1000);
    const t = setTimeout(() => {
      setMapCenter(centerOn);
      setUiZoom(5);
      onBoundsChange(syntheticBounds, 5);
      onCenterComplete?.();
    }, 1100);
    return () => clearTimeout(t);
  }, [centerOn, onCenterComplete, onBoundsChange]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;

    const scene = globeRef.current.scene();

    if (scene && !scene.getObjectByName('ambientLight')) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
      ambientLight.name = 'ambientLight';
      scene.add(ambientLight);
    }

    if (scene && !scene.getObjectByName('sunLight')) {
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
      sunLight.position.set(5, 2, 2);
      sunLight.name = 'sunLight';
      scene.add(sunLight);
    }

    const camera = globeRef.current.camera();
    if (camera) {
      camera.near = 1;
      camera.far = 20000;
      camera.updateProjectionMatrix();
    }

    const renderer = globeRef.current.renderer();
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.005;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    setTimeout(() => {
      globeRef.current?.pointOfView({ lat: 20, lng: 20, altitude: 5.2 }, 0);
    }, 100);

    let lastUiZoom = -1;
    let lastAltitudeGroup = -1;
    let lastLat = 999;
    let lastLng = 999;

    const handleCameraChange = () => {
      const pov = globeRef.current?.pointOfView();

      if (pov && pov.altitude) {
        let newAltGroup = 3;
        if (pov.altitude <= 0.6) newAltGroup = 1;
        else if (pov.altitude <= 1.2) newAltGroup = 2;

        if (newAltGroup !== lastAltitudeGroup) {
          setAltitudeGroup(newAltGroup);
          lastAltitudeGroup = newAltGroup;
        }

        let nextUiZoom = 1;
        if (pov.altitude <= 0.3) nextUiZoom = 12;
        else if (pov.altitude <= 0.6) nextUiZoom = 8;
        else if (pov.altitude <= 1.2) nextUiZoom = 5;
        else if (pov.altitude <= 2.0) nextUiZoom = 3;
        else nextUiZoom = 2;

        controls.autoRotate = nextUiZoom <= 2.5;

        setMapCenter({ lat: pov.lat, lng: pov.lng });
        setUiZoom(nextUiZoom);

        const latChanged = Math.abs(pov.lat - lastLat) > 5;
        const lngChanged = Math.abs(pov.lng - lastLng) > 5;
        const zoomChanged = nextUiZoom !== lastUiZoom;

        if (latChanged || lngChanged || zoomChanged) {
          const span =
            nextUiZoom >= 10 ? 6 :
              nextUiZoom >= 7 ? 12 :
                nextUiZoom >= 5 ? 25 :
                  nextUiZoom >= 3 ? 60 :
                    180;

          const dynamicBounds = {
            getNorth: () => pov.lat + span / 2,
            getSouth: () => pov.lat - span / 2,
            getEast: () => pov.lng + span / 2,
            getWest: () => pov.lng - span / 2,
            getCenter: () => ({ lat: pov.lat, lng: pov.lng })
          };

          onBoundsChange(dynamicBounds, nextUiZoom);

          lastUiZoom = nextUiZoom;
          lastLat = pov.lat;
          lastLng = pov.lng;
        }
      }
    };

    controls.addEventListener('change', handleCameraChange);
    handleCameraChange();

    return () => {
      controls.removeEventListener('change', handleCameraChange);
    };
  }, [onBoundsChange]);

  const ringsData = useMemo(() => {
    return [];
  }, [interests]);

  useEffect(() => {
    if (!globeRef.current || dimensions.width === 0) return;

    const scene = globeRef.current.scene();
    if (!scene) return;

    if (!scene.getObjectByName('starfield')) {
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 6000;
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const radius = 500;
      const coolWhite = new THREE.Color('#dfe7ff');
      const warmWhite = new THREE.Color('#ffffff');

      for (let i = 0; i < starCount; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        const r = radius * (0.7 + 0.3 * Math.random());

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        const idx = i * 3;
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;

        const t = Math.random();
        const c = coolWhite.clone().lerp(warmWhite, t);

        colors[idx] = c.r;
        colors[idx + 1] = c.g;
        colors[idx + 2] = c.b;
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const starMaterial = new THREE.PointsMaterial({
        size: 0.35,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        vertexColors: true
      });

      const stars = new THREE.Points(starGeometry, starMaterial);
      stars.name = 'starfield';
      scene.add(stars);
      starsRef.current = stars;

      if (starAnimationIdRef.current) {
        cancelAnimationFrame(starAnimationIdRef.current);
      }

      const start = performance.now();

      const animateStars = (now: number) => {
        const t = (now - start) / 1000;

        if (starsRef.current) {
          starsRef.current.rotation.y = t * 0.02;
          const mat = starsRef.current.material as THREE.PointsMaterial;
          mat.opacity = 0.6 + 0.2 * Math.sin(t * 0.8);
        }

        starAnimationIdRef.current = requestAnimationFrame(animateStars);
      };

      starAnimationIdRef.current = requestAnimationFrame(animateStars);
    }

    if (!scene.getObjectByName('atmosphereGlow')) {
      const globeRadius =
        typeof globeRef.current.getGlobeRadius === 'function'
          ? globeRef.current.getGlobeRadius()
          : 100;

      const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.05, 64, 64);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX_SHADER,
        fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });

      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphere.name = 'atmosphereGlow';
      scene.add(atmosphere);
    }

    return () => {
      if (starAnimationIdRef.current) {
        cancelAnimationFrame(starAnimationIdRef.current);
        starAnimationIdRef.current = null;
      }
    };
  }, [dimensions.width]);

  const visibleNews = useMemo(() => {
    return news.filter((item) => {
      if (altitudeGroup === 3) return item.importance >= 4;
      if (altitudeGroup === 2) return item.importance >= 2;
      return true;
    });
  }, [news, altitudeGroup]);

  const visibleRoutes = useMemo(() => {
    return interests.filter(
      (item) => item.type === 'Travel Route' && Array.isArray(item.coords) && item.coords.length > 0
    );
  }, [interests]);

  if (uiZoom >= 7) {
    return (
      <div className="h-full w-full">
        <LeafletMap
          center={mapCenter}
          zoom={uiZoom + 2}
          news={visibleNews}
          onBoundsChange={onBoundsChange}
          onMarkerClick={onMarkerClick}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black cursor-grab active:cursor-grabbing">
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
          globeTileEngineUrl={altitudeGroup !== 3 ? cartoDbUrl : undefined}
          tilesTransitionDuration={1000}
          pointsData={visibleNews}
          pointLat="lat"
          pointLng="lng"
          pointColor={getPointColor}
          pointAltitude={0.03}
          pointRadius={getPointRadius}
          pointsMerge={false}
          onPointClick={(point) => onMarkerClick(point as NewsItem)}
          htmlElementsData={[]}
          ringsData={ringsData}
          pathsData={visibleRoutes}
          pathPoints={getPathPoints}
          pathPointLat={(p: number[]) => p[0]}
          pathPointLng={(p: number[]) => p[1]}
          pathColor={getPathColor}
          pathStroke={0.4}
          pathDashLength={0.2}
          pathDashGap={0.1}
          pathDashAnimateTime={2000}
        />
      )}
    </div>
  );
});

export default Map;
