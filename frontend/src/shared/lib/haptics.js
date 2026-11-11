/**
 * Light haptic tick on phones that support the Vibration API (Android Chrome).
 * Silently does nothing on desktop, iOS Safari, or when the user prefers reduced motion.
 */
export function haptic(pattern = 8) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* some browsers throw before the first user gesture */
  }
}
