import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const COLORS = ['#7c3aed', '#9333ea', '#c4b5fd', '#34d399', '#ffffff'];

/**
 * One-shot particle burst. Change `trigger` (e.g. a counter) to fire it again.
 * Place inside a `position: relative` parent; particles fly out from its center.
 */
export default function Burst({ trigger, count = 16 }) {
  const reduce = useReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 46 + Math.random() * 40;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 4 + Math.random() * 5,
          color: COLORS[i % COLORS.length],
          rotate: Math.random() * 360,
        };
      }),
    // A new set of directions for every trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger, count],
  );

  if (reduce || !trigger) return null;

  return (
    <span className="burst" aria-hidden="true">
      <AnimatePresence>
        {particles.map((p, i) => (
          <motion.span
            key={`${trigger}-${i}`}
            className="burst-particle"
            style={{ width: p.size, height: p.size, background: p.color, borderRadius: i % 3 ? '50%' : 2 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{ x: p.x, y: p.y, scale: [0, 1.2, 0.8], opacity: [1, 1, 0], rotate: p.rotate }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}
