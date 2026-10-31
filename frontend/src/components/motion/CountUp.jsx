import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Animates a number from its previous value to `value`. Writes textContent directly. */
export default function CountUp({ value, duration = 0.9, fallback = '–' }) {
  const ref = useRef(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (value == null || !ref.current) return undefined;
    if (reduce) {
      ref.current.textContent = value;
      prev.current = value;
      return undefined;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v); },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span ref={ref}>{value == null ? fallback : 0}</span>;
}
