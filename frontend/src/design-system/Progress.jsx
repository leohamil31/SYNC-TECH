import { useId } from 'react';
import { motion } from 'framer-motion';
import { ease } from './motion/variants';

const clamp = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

/** Linear progress. `value` is 0..1. Animates from the previous value on change. */
export function ProgressBar({ value, label, className = '' }) {
  const v = clamp(value);
  return (
    <div
      className={`progress-bar${v >= 1 ? ' is-done' : ''} ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={label}
    >
      <motion.span initial={false} animate={{ scaleX: v }} transition={{ duration: 0.8, ease }} />
    </div>
  );
}

/** Circular progress with the percentage in the middle. */
export function ProgressRing({ value, size = 56, stroke = 5, label, showLabel = true }) {
  const v = clamp(value);
  const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      className={`progress-ring${v >= 1 ? ' is-done' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={label}
      style={{ '--ring-label': `${Math.max(0.65, size / 70)}rem` }}
    >
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
        </defs>
        <circle className="track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <motion.circle
          className="value"
          stroke={`url(#${gradientId})`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - v) }}
          transition={{ duration: 1, ease, delay: 0.15 }}
        />
      </svg>
      {showLabel && <strong aria-hidden="true">{Math.round(v * 100)}%</strong>}
    </span>
  );
}
