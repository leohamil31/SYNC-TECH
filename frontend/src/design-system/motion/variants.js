// Shared motion tokens; mirror --ease-out / --dur in tokens.css.
export const ease = [0.22, 1, 0.36, 1];
export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };
export const softSpring = { type: 'spring', stiffness: 220, damping: 26 };

export const page = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease, staggerChildren: 0.05 } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.18, ease } },
};

export const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease } },
};

export const stagger = (step = 0.05, delay = 0) => ({
  animate: { transition: { staggerChildren: step, delayChildren: delay } },
});

export const row = {
  initial: { opacity: 0, y: 6 },
  animate: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.28, ease, delay: Math.min(i, 12) * 0.03 } }),
  exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease } },
};

export const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18, delay: 0.04 } },
};

export const dialog = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.16, ease } },
};

export const toast = {
  initial: { opacity: 0, y: 16, scale: 0.94 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, x: 60, transition: { duration: 0.2, ease } },
};
