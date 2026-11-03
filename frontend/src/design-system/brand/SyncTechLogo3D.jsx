import { useMemo, useRef } from 'react';
import './synctech-logo-3d.css';

const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [A, B] = [p(a), p(b)];
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
const layersFor = (n, from, to, step) =>
  Array.from({ length: n }, (_, i) => ({ z: -(i + 1) * step, c: mix(from, to, (i + 1) / n) })).reverse();

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animated, extruded SyncTech logo (CSS 3D, no WebGL).
 * Intro: letters drop in one by one, then a light sheen sweeps across.
 * - size: font-size of the wordmark (any CSS length)
 * - depth: extrusion layers · sway: idle loop · interactive: pointer tilt
 * - replayKey: change to replay the intro
 */
export default function SyncTechLogo3D({ size, depth = 16, sway = true, interactive = true, replayKey = 0, className = '' }) {
  const ref = useRef(null);
  const { sync, tech } = useMemo(() => ({
    sync: layersFor(depth, '#5b21b6', '#12052b', 1.3),
    tech: layersFor(depth, '#4c1d95', '#0f0620', 1.3),
  }), [depth]);

  const onPointerMove = (e) => {
    if (!interactive || reduced()) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    ref.current.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    ref.current.classList.add('is-hover');
  };
  const onPointerLeave = () => {
    ref.current.style.setProperty('--px', 0);
    ref.current.style.setProperty('--py', 0);
    ref.current.classList.remove('is-hover');
  };

  return (
    <div
      ref={ref}
      key={replayKey}
      className={`st3d${sway ? ' st3d--sway' : ''} ${className}`}
      style={size ? { '--fs': size } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      role="img"
      aria-label="SyncTech"
    >
      <div className="st3d-sway">
        <div className="st3d-rig">
          <div className="st3d-word" aria-hidden="true">
            {[...'SyncTech'].map((ch, i) => {
              const isSync = i < 4;
              return (
                <span key={i} className={`st3d-letter ${isSync ? 'is-sync' : 'is-tech'}`} style={{ '--i': i }}>
                  {(isSync ? sync : tech).map((l) => (
                    <span key={l.z} className="st3d-layer" style={{ color: l.c, transform: `translateZ(${l.z}px)` }}>{ch}</span>
                  ))}
                  <span className="st3d-face">{ch}</span>
                  <span className="st3d-sheen">{ch}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
