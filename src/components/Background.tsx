import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { skyGradient, type Condition } from '@/lib/weather-codes';

interface BackgroundProps {
  condition: Condition;
  isDay: boolean;
  photoUrl?: string | null;
}

/** Full-screen sky that cross-fades between weather conditions, with optional city photo. */
export default function Background({ condition, isDay, photoUrl }: BackgroundProps) {
  const gradient = skyGradient(condition, isDay);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <AnimatePresence initial={false}>
        <motion.div
          key={gradient}
          className="absolute inset-0"
          style={{ backgroundImage: gradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      <AnimatePresence>
        {photoUrl && (
          <motion.img
            key={photoUrl}
            src={photoUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 0.55, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Soft glows for depth */}
      <div
        className="absolute -top-40 -left-40 size-[36rem] rounded-full opacity-40 blur-3xl"
        style={{ background: isDay ? 'radial-gradient(circle, #fde68a55, transparent 70%)' : 'radial-gradient(circle, #a5b4fc33, transparent 70%)' }}
      />
      {!isDay && <Stars />}
      {(condition === 'rain' || condition === 'drizzle' || condition === 'storm') && (
        <Particles kind="rain" count={condition === 'drizzle' ? 40 : 90} />
      )}
      {condition === 'snow' && <Particles kind="snow" count={70} />}
      {condition === 'storm' && <Lightning />}

      {/* Readability scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/35" />
    </div>
  );
}

// Deterministic pseudo-random so particles don't jump around between renders.
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const Particles = memo(function Particles({ kind, count }: { kind: 'rain' | 'snow'; count: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: rand(i + 1) * 100,
        delay: rand(i + 100) * -10,
        duration: kind === 'rain' ? 0.6 + rand(i + 200) * 0.5 : 7 + rand(i + 200) * 8,
        size: kind === 'rain' ? 1 : 3 + rand(i + 300) * 4,
        opacity: 0.25 + rand(i + 400) * 0.45,
        drift: kind === 'rain' ? '-6vw' : `${(rand(i + 500) - 0.5) * 20}vw`,
      })),
    [count, kind],
  );

  return (
    <div className="absolute inset-0">
      {items.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: p.opacity,
              '--drift': p.drift,
              ...(kind === 'rain'
                ? {
                    width: 1,
                    height: 70,
                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.7))',
                    rotate: '5deg',
                  }
                : { width: p.size, height: p.size, borderRadius: 9999, background: 'white', filter: 'blur(0.5px)' }),
            } as unknown as React.CSSProperties
          }
        />
      ))}
    </div>
  );
});

const Stars = memo(function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        left: rand(i + 7) * 100,
        top: rand(i + 70) * 60,
        size: rand(i + 700) < 0.85 ? 1 : 2,
        opacity: 0.2 + rand(i + 900) * 0.6,
      })),
    [],
  );
  return (
    <div className="absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: s.opacity }}
        />
      ))}
    </div>
  );
});

function Lightning() {
  return (
    <motion.div
      className="absolute inset-0 bg-white"
      animate={{ opacity: [0, 0, 0.18, 0, 0.1, 0, 0] }}
      transition={{ duration: 7, repeat: Infinity, times: [0, 0.6, 0.62, 0.64, 0.66, 0.7, 1] }}
    />
  );
}
