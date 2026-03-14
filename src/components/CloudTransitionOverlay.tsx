import { useMemo } from 'react';
import { motion } from 'motion/react';

type CloudPhase = 'in' | 'out';

interface CloudTransitionOverlayProps {
  phase: CloudPhase;
}

const CLOUD_DURATION_MS = 780;

const theme = {
  sky: '#0a1628',
  layerBack: '#0f3d4a',
  layerMid: '#155e75',
  layerFront: '#22d3ee',
  layerWhite: '#cffafe'
};

function CloudBand({
  phase,
  color,
  sizes,
  xPercent,
  yPercent,
  fromSide,
  delay = 0,
  duration
}: {
  phase: CloudPhase;
  color: string;
  sizes: string[];
  xPercent: number;
  yPercent: number;
  fromSide: 'left' | 'right';
  delay?: number;
  duration: number;
}) {
  const enterFrom = fromSide === 'left' ? -120 : 120;
  const exitTo = fromSide === 'left' ? 120 : -120;
  return (
    <motion.div
      className="absolute flex items-end justify-center"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: 'translate(-50%, -50%)'
      }}
      initial={
        phase === 'in'
          ? { x: `${enterFrom}vw`, opacity: 0.6 }
          : { x: 0, opacity: 1 }
      }
      animate={
        phase === 'in'
          ? { x: 0, opacity: 1 }
          : { x: `${exitTo}vw`, opacity: 0.6 }
      }
      transition={{
        duration: duration / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: delay / 1000
      }}
    >
      <div
        className="flex items-end justify-center"
        style={{ flexDirection: fromSide === 'right' ? 'row-reverse' : 'row' }}
      >
        {sizes.map((size, i) => (
          <div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: size,
              height: size,
              marginLeft: fromSide === 'left' && i > 0 ? '-14%' : undefined,
              marginRight: fromSide === 'right' && i > 0 ? '-14%' : undefined,
              backgroundColor: color
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

const bumpSizes = (base: number, vw: number, max: number, count: number) =>
  Array.from({ length: count }, (_, i) =>
    `clamp(${base + i * 8}px, ${vw + i * 2}vw, ${max + i * 20}px)`
  );

const COLORS = [theme.layerBack, theme.layerMid, theme.layerFront, theme.layerWhite] as const;
const SIZE_SETS = [
  () => bumpSizes(90, 20, 220, 6),
  () => bumpSizes(110, 24, 280, 6),
  () => bumpSizes(120, 26, 300, 7),
  () => bumpSizes(140, 28, 360, 7)
];

function randomIn(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomIn(min, max + 1));
}

export default function CloudTransitionOverlay({ phase }: CloudTransitionOverlayProps) {
  const duration = CLOUD_DURATION_MS;

  const clouds = useMemo(() => {
    const cols = 5;
    const rows = 6;
    const cells: { xMin: number; xMax: number; yMin: number; yMax: number }[] = [];
    const xStart = 3;
    const xSpan = 48;
    const yStart = 5;
    const ySpan = 85;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cells.push({
          xMin: xStart + (col / cols) * xSpan,
          xMax: xStart + ((col + 1) / cols) * xSpan,
          yMin: yStart + (row / rows) * ySpan,
          yMax: yStart + ((row + 1) / rows) * ySpan
        });
      }
    }
    const shuffled = [...cells].sort(() => Math.random() - 0.5);
    const count = Math.min(28, shuffled.length);
    return Array.from({ length: count }, (_, i) => {
      const cell = shuffled[i];
      return {
        id: i,
        xPercent: randomIn(cell.xMin, cell.xMax),
        yPercent: randomIn(cell.yMin, cell.yMax),
        fromSide: (randomInt(0, 1) === 0 ? 'left' : 'right') as 'left' | 'right',
        delayMs: randomInt(0, 220),
        color: COLORS[randomInt(0, COLORS.length - 1)],
        sizes: SIZE_SETS[randomInt(0, SIZE_SETS.length - 1)]()
      };
    });
  }, []);

  const delayFor = (delayMs: number, phase: 'in' | 'out') =>
    phase === 'in' ? delayMs : Math.max(0, delayMs * 0.35);

  return (
    <div
      className="absolute inset-0 z-[2500] pointer-events-auto overflow-hidden"
      aria-hidden
    >
      {/* Base sky / veil so swap is fully masked */}
      <motion.div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: theme.sky }}
        initial={phase === 'in' ? { opacity: 0 } : { opacity: 1 }}
        animate={phase === 'in' ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: duration / 1000,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      />

      {/* Non-symmetric: each cloud has its own random (x, y) and enters from a random side */}
      <div className="absolute inset-0 pointer-events-none">
        {clouds.map((cloud) => (
          <CloudBand
            key={cloud.id}
            phase={phase}
            color={cloud.color}
            xPercent={cloud.xPercent}
            yPercent={cloud.yPercent}
            fromSide={cloud.fromSide}
            delay={delayFor(cloud.delayMs, phase)}
            duration={duration}
            sizes={cloud.sizes}
          />
        ))}
      </div>
    </div>
  );
}

export const CLOUD_TRANSITION_DURATION_MS = CLOUD_DURATION_MS;
