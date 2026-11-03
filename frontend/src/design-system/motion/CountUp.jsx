import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

const round = (v) => Math.round(v);

/**
 * Animates a number from its previous value to `value`. Writes textContent directly (no re-render per frame).
 * Pass a stable `format` (module-level or memoized), otherwise the animation restarts on every render.
 */
export default function CountUp({ value, duration = 0.9, format = round, fallback = '–' }) {
  const ref = useRef(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (value == null || !ref.current) return undefined;
    if (reduce) {
      ref.current.textContent = format(value);
      prev.current = value;
      return undefined;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, reduce, format]);

  return <span ref={ref}>{value == null ? fallback : format(0)}</span>;
}
