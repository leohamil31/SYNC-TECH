import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const SPRING = { stiffness: 260, damping: 22, mass: 0.6 };

/**
 * Pointer-driven 3D tilt for cards. Spread the returned props on a motion element:
 *   const tilt = useTilt(); <motion.div {...tilt} />
 * Uses motion values, so moving the pointer never re-renders React.
 */
export function useTilt(max = 6) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), SPRING);
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), SPRING);

  if (reduce) return {};

  return {
    style: { rotateX, rotateY, transformPerspective: 900 },
    onPointerMove: (e) => {
      if (e.pointerType !== 'mouse') return;
      const rect = e.currentTarget.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width);
      y.set((e.clientY - rect.top) / rect.height);
    },
    onPointerLeave: () => {
      x.set(0.5);
      y.set(0.5);
    },
  };
}
