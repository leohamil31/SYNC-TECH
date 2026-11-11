import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const round = (v) => Math.round(v);
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Odometer number: every digit is a vertical strip 0-9 that rolls to its value.
 * It first shows zeros ("000") and rolls in right after mount; later changes roll
 * from the previous digits. Digits are keyed from the right, so 99 -> 100 animates naturally.
 * `format` turns the number into text (e.g. "1.234" or "12,5%"); only digits roll.
 */
export default function CountUp({ value, duration = 0.9, format = round, fallback = '–' }) {
  const reduce = useReducedMotion();
  const [rolled, setRolled] = useState(false);

  useEffect(() => {
    // Two frames: let the browser paint the zeros before moving the strips.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setRolled(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  if (value == null) return <span>{fallback}</span>;

  const text = String(format(value));
  const chars = [...text];
  const showReal = rolled || reduce;

  return (
    <span className="odo">
      <span className="sr-only">{text}</span>
      <span className="odo-chars" aria-hidden="true">
        {chars.map((ch, i) => {
          const fromRight = chars.length - 1 - i;
          if (!/\d/.test(ch)) {
            return (
              <span key={`s${fromRight}`} className="odo-sep">
                {ch}
              </span>
            );
          }
          const digit = showReal ? Number(ch) : 0;
          return (
            <span key={`d${fromRight}`} className="odo-digit">
              <span
                className="odo-strip"
                style={{
                  transform: `translateY(${-digit * 10}%)`,
                  transitionDuration: reduce ? '0s' : `${duration}s`,
                  transitionDelay: reduce ? '0s' : `${Math.min(fromRight, 6) * 0.07}s`,
                }}
              >
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
