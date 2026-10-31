// Shared motion tokens — mirror the CSS --ease-* / --dur-* variables.
export const ease = [0.22, 1, 0.36, 1];
export const spring = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 };
export const softSpring = { type: 'spring', stiffness: 220, damping: 26 };

export const page = {
  initial: { opacity: 0, y: 14, rotateX: 4, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', transition: { duration: 0.42, ease, staggerChildren: 0.05 } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.18, ease } },
};

export const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export const stagger = (step = 0.045, delay = 0) => ({
  animate: { transition: { staggerChildren: step, delayChildren: delay } },
});

export const row = {
  initial: { opacity: 0, y: 8 },
  animate: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.32, ease, delay: Math.min(i, 12) * 0.035 } }),
  exit: { opacity: 0, x: 24, scale: 0.98, transition: { duration: 0.22, ease } },
};

export const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18, delay: 0.04 } },
};

export const dialog = {
  initial: { opacity: 0, y: 28, scale: 0.94, rotateX: -14 },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: spring },
  exit: { opacity: 0, y: 16, scale: 0.97, rotateX: 8, transition: { duration: 0.16, ease } },
};

export const toast = {
  initial: { opacity: 0, x: 40, scale: 0.92 },
  animate: { opacity: 1, x: 0, scale: 1, transition: spring },
  exit: { opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2, ease } },
};
