import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { NewsItem, UserInterest, NewsCategory } from '../types';
import LeafletMap from './LeafletMap';

interface MapProps {
  news: NewsItem[];
  interests: UserInterest[];
  /** Parent's zoom (from onBoundsChange). Used for globe vs 2D threshold and for 2D map so zoom stays in sync. */
  zoom?: number;
  /** Parent's bounds (from onBoundsChange). Used for 2D map center so view stays in sync. */
  currentBounds?: { getCenter: () => { lat: number; lng: number }; getNorth: () => number; getSouth: () => number; getEast: () => number; getWest: () => number } | null;
  onBoundsChange: (bounds: any, zoom: number) => void;
  onMarkerClick: (item: NewsItem) => void;
  showHeatmap: boolean;
  showSentiment: boolean;
  /** When set, globe flies to this point (e.g. from Command Assistant "Take me to X"). */
  centerOn?: { lat: number; lng: number } | null;
  /** Called after centering so App can clear centerOn. */
  onCenterComplete?: () => void;
  /** Active category - dims non-matching globe markers for focus */
  activeCategory?: NewsCategory;
}

const cartoDbUrl = (x: number, y: number, l: number) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager/${l}/${x}/${y}.png`;

// Intelligence dashboard palette per category
const CATEGORY_COLORS: Record<string, string> = {
  Geopolitics: '#ff4d4d',
  Business:    '#f1c40f',
  Technology:  '#00d4ff',
  Climate:     '#2ecc71',
};

// Location pin SVG marker
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
    </defs>
    <path d="M${cx} ${h - 2} C${cx} ${h - 2} ${size - 2} ${r + 4} ${size - 2} ${r + 2} C${size - 2} ${2} ${2} ${2} ${2} ${r + 2} C${2} ${r + 4} ${cx} ${h - 2} ${cx} ${h - 2}Z"
      fill="url(#glow_${color.replace('#','')})"/>
    <path d="M${cx} ${h - 2} C${cx} ${h - 2} ${size - 2} ${r + 4} ${size - 2} ${r + 2} C${size - 2} ${2} ${2} ${2} ${2} ${r + 2} C${2} ${r + 4} ${cx} ${h - 2} ${cx} ${h - 2}Z"
      fill="none" stroke="white" stroke-opacity="0.3" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${r + 2}" r="${innerR}" fill="white" fill-opacity="0.9"/>
  </svg>`;
}

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
  zoom: zoomFromParent,
  currentBounds,
  onBoundsChange,
  onMarkerClick,
  showHeatmap,
  showSentiment,
  centerOn = null,
  onCenterComplete,
  activeCategory,
}: MapProps) {
  const globeRef = useRef<any>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const starAnimationIdRef = useRef<number | null>(null);
  const prevDetailedRef = useRef(false);
  const isInitialPOVSetRef = useRef(false);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [altitudeGroup, setAltitudeGroup] = useState(3);
  const [uiZoom, setUiZoom] = useState(3);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [filterFading, setFilterFading] = useState(false);
  const prevCategoryRef = useRef(activeCategory);

  useEffect(() => {
    if (prevCategoryRef.current !== activeCategory) {
      prevCategoryRef.current = activeCategory;
      setFilterFading(true);
      const t = setTimeout(() => setFilterFading(false), 300);
      return () => clearTimeout(t);
    }
  }, [activeCategory]);

  const effectiveZoom = zoomFromParent ?? uiZoom;

  // Hysteresis: enter Leaflet at zoom >= 6.3, leave at zoom < 5.5
  // Prevents snapping/flickering at the transition boundary
  const [isDetailedMap, setIsDetailedMap] = useState(false);
  const showGlobe = !isDetailedMap;

  useEffect(() => {
    setIsDetailedMap(prev => {
      if (!prev && effectiveZoom >= 6.3) return true;
      if (prev && effectiveZoom < 5.5) return false;
      return prev;
    });
  }, [effectiveZoom]);


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
    if (isDetailedMap) {
      setMapCenter(centerOn);
      onBoundsChange(syntheticBounds, 8); // Stay in detailed view at city level
      onCenterComplete?.();
      return;
    }
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.2 }, 1000);
    const t = setTimeout(() => {
      setMapCenter(centerOn);
      setUiZoom(6.1); // Slightly above 6 to trigger transition
      onBoundsChange(syntheticBounds, 6.1);
      onCenterComplete?.();
    }, 1100);
    return () => clearTimeout(t);
  }, [centerOn, onCenterComplete, onBoundsChange, isDetailedMap]);

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
    if (prevDetailedRef.current && !isDetailedMap && currentBounds) {
      const center = currentBounds.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
      // Remove hardcoded setUiZoom(4) reset
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: 2.0 }, 0);
      }
    }
    prevDetailedRef.current = isDetailedMap;
  }, [isDetailedMap, onBoundsChange, currentBounds]);

  // Removed conditional visibility logic that caused rerenders
  useEffect(() => {
    if (!isDetailedMap) {
      const scene = globeRef.current?.scene();
      if (scene && starsRef.current) {
        scene.add(starsRef.current);
      }
    }
  }, [isDetailedMap]);

  useEffect(() => {
    if (isDetailedMap || dimensions.width === 0) return;
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

    // Only set initial POV if not already set or centered
    // Default: Asia-Pacific region
    if (!isInitialPOVSetRef.current && !centerOn) {
      setTimeout(() => {
        globeRef.current?.pointOfView({ lat: 15, lng: 115, altitude: 2.5 }, 0);
        isInitialPOVSetRef.current = true;
      }, 500);
    }

    let lastUiZoom = -1;
    let lastAltitudeGroup = -1;
    let lastLat = 999;
    let lastLng = 999;
    let lastCenterLat = 999;
    let lastCenterLng = 999;

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
        // Smooth piece-wise linear altitude -> zoom so the display never jumps.
        // Control points (altitude, zoom): interpolated between each pair.
        const ALT_ZOOM: [number, number][] = [
          [4.0, 1.0], [3.5, 2.0], [2.5, 3.0],
          [2.0, 4.0], [1.7, 5.0], [1.5, 5.8],
          [1.2, 6.4], [1.0, 7.0], [0.7, 8.0],
          [0.4, 9.0], [0.1, 10.0],
        ];
        const alt = pov.altitude;
        if (alt >= ALT_ZOOM[0][0]) {
          nextUiZoom = ALT_ZOOM[0][1];
        } else if (alt <= ALT_ZOOM[ALT_ZOOM.length - 1][0]) {
          nextUiZoom = ALT_ZOOM[ALT_ZOOM.length - 1][1];
        } else {
          for (let i = 0; i < ALT_ZOOM.length - 1; i++) {
            const [a0, z0] = ALT_ZOOM[i];
            const [a1, z1] = ALT_ZOOM[i + 1];
            if (alt <= a0 && alt >= a1) {
              const t = (a0 - alt) / (a0 - a1);
              nextUiZoom = z0 + t * (z1 - z0);
              break;
            }
          }
        }

        controls.autoRotate = nextUiZoom <= 5;

        // Throttle setMapCenter: only update when center moved > 0.5° to avoid
        // creating a new object (and re-render) on every Three.js frame.
        if (Math.abs(pov.lat - lastCenterLat) > 0.5 || Math.abs(pov.lng - lastCenterLng) > 0.5) {
          setMapCenter({ lat: pov.lat, lng: pov.lng });
          lastCenterLat = pov.lat;
          lastCenterLng = pov.lng;
        }
        // setUiZoom: React skips re-render when value is unchanged (Object.is)
        setUiZoom(nextUiZoom);

        const latChanged = Math.abs(pov.lat - lastLat) > 2;
        const lngChanged = Math.abs(pov.lng - lastLng) > 2;
        const zoomChanged = Math.abs(nextUiZoom - lastUiZoom) > 0.1;

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
  }, [onBoundsChange, isDetailedMap, dimensions.width]);

  // Creates a DOM diamond-pin SVG element for each news item on the globe.
  const makeGlobePin = useCallback((d: object) => {
    const item = d as NewsItem;
    const color = CATEGORY_COLORS[item.category] ?? '#aaaaaa';
    const size = item.importance >= 4 ? 22 : 16;
    const el = document.createElement('div');
    el.style.cssText = `cursor:pointer;transform:translate(-50%,-100%);pointer-events:auto;filter:drop-shadow(0 2px 8px ${color}aa);transition:filter 0.25s ease,transform 0.25s ease;animation:pinFadeIn 0.4s ease-out`;
    el.title = item.title;
    el.innerHTML = makeLocationPinSvg(color, size);
    el.addEventListener('mouseenter', () => {
      el.style.filter = `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color}88)`;
      el.style.transform = 'translate(-50%,-100%) scale(1.3)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.filter = `drop-shadow(0 2px 8px ${color}aa)`;
      el.style.transform = 'translate(-50%,-100%) scale(1)';
    });
    el.addEventListener('click', (e) => { e.stopPropagation(); onMarkerClick(item); });
    return el;
  }, [onMarkerClick]);

  const visibleNews = useMemo(() => {
    if (effectiveZoom < 1 || effectiveZoom > 10) return [];
    
    return news.filter((item) => {
      // At full globe, show everything importance >= 3 so pins are always present
      if (effectiveZoom < 3) return item.importance >= 3;
      if (effectiveZoom < 6) return item.importance >= 2;
      return true;
    });
  }, [news, effectiveZoom]);

  const visibleRoutes = useMemo(() => {
    return interests.filter(
      (item) => item.type === 'Travel Route' && Array.isArray(item.coords) && item.coords.length > 0
    );
  }, [interests]);



  useEffect(() => {
    if (isDetailedMap || !globeRef.current || dimensions.width === 0) return;

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
  }, [dimensions.width, isDetailedMap]);

  // mapCenter is updated every 0.5deg of globe camera movement - more current
  // than currentBounds (throttled to 2deg). Prioritising it prevents the Leaflet
  // view from landing 1-2deg away from the globe's actual zoom target.
  const effectiveCenter = mapCenter ?? currentBounds?.getCenter?.() ?? { lat: 0, lng: 0 };

  return (
    <div className="relative h-full w-full bg-black">
      
      {/* 2D Leaflet Map Layer */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 z-[2] ${
          isDetailedMap ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={isDetailedMap ? { opacity: filterFading ? 0 : 1, transition: 'opacity 0.3s ease' } : undefined}
      >
        <LeafletMap
          center={effectiveCenter}
          zoom={Math.max(2, Math.min(18, effectiveZoom))}
          news={visibleNews}
          onBoundsChange={onBoundsChange}
          onMarkerClick={onMarkerClick}
        />
      </div>

      {/* 3D Globe Layer */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 z-[1] bg-black cursor-grab active:cursor-grabbing ${
          showGlobe ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
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
            htmlElementsData={isDetailedMap ? [] : visibleNews}
            htmlElement={makeGlobePin}
            htmlLat="lat"
            htmlLng="lng"
            htmlAltitude={0.02}
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

      {/* Glass status bar - shows view mode, zoom, and news count */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[3] pointer-events-none">
        <div className="flex items-center gap-3 rounded-full border border-white/[0.07] bg-black/35 backdrop-blur-2xl px-5 py-1.5 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/40 animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/35">
              {isDetailedMap ? 'DETAIL' : 'GLOBAL'} // Z{Math.round(effectiveZoom * 10) / 10}
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
            {visibleNews.length} Events
          </span>
        </div>
      </div>
    </div>
  );
});

export default Map;
