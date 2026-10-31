import { useRef } from 'react';

const canTilt = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer-driven 3D tilt with a specular highlight.
 * Writes CSS variables directly (no React re-render per mousemove), throttled to rAF.
 * Styling lives in `.tilt` (styles.css). Works with any element/component via `as`.
 */
export default function TiltCard({ as: Comp = 'div', max = 7, className = '', children, ...rest }) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onPointerMove = (e) => {
    if (!canTilt()) return;
    const el = ref.current;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
      el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.classList.add('is-tilting');
    });
  };

  const onPointerLeave = () => {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <Comp
      ref={ref}
      className={`tilt gradient-border ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...rest}
    >
      {children}
    </Comp>
  );
}
