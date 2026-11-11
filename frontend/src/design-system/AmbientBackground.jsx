import { useEffect, useRef } from 'react';
import './styles/ambient.css';

const finePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Living backdrop behind the glass: three slow violet light fields drift on a loop,
 * and a soft spotlight trails the cursor on desktop. Pure CSS animation; the pointer
 * position is written to CSS variables once per frame, so React never re-renders.
 */
export default function AmbientBackground() {
  const ref = useRef(null);

  useEffect(() => {
    if (!finePointer()) return undefined;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        ref.current?.style.setProperty('--px', `${e.clientX}px`);
        ref.current?.style.setProperty('--py', `${e.clientY}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div ref={ref} className="ambient" aria-hidden="true">
      <span className="ambient-blob ambient-blob--a" />
      <span className="ambient-blob ambient-blob--b" />
      <span className="ambient-blob ambient-blob--c" />
      <span className="ambient-dots" />
      <span className="ambient-spot" />
      <span className="ambient-grain" />
    </div>
  );
}
