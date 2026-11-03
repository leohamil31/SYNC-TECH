import { forwardRef, useRef } from 'react';

/**
 * Frosted-glass surface for the web.
 *
 * The props mirror `GlassView` from `expo-glass-effect` (React Native / iOS Liquid Glass)
 * so a future Expo client can share call sites:
 *   - glassEffectStyle: 'regular' | 'clear'   (amount of frost)
 *   - tintColor: any CSS color                 (overrides the base translucent fill)
 *   - isInteractive: boolean                   (pointer-tracked highlight)
 * On the web the effect is `backdrop-filter`; browsers without it get a solid surface (see components.css).
 *
 * `as` renders any element or component, including `motion.div`.
 */
const GlassView = forwardRef(function GlassView(
  { as: Component = 'div', glassEffectStyle = 'regular', tintColor, isInteractive = false, className = '', style, onPointerMove, ...rest },
  forwardedRef,
) {
  const localRef = useRef(null);
  const ref = forwardedRef || localRef;

  const handlePointerMove = (event) => {
    onPointerMove?.(event);
    if (!isInteractive) return;
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--gx', `${event.clientX - rect.left}px`);
    node.style.setProperty('--gy', `${event.clientY - rect.top}px`);
  };

  const classes = ['glass', glassEffectStyle === 'clear' && 'glass--clear', isInteractive && 'glass--interactive', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      ref={ref}
      className={classes}
      style={tintColor ? { ...style, '--glass-tint': tintColor } : style}
      onPointerMove={handlePointerMove}
      {...rest}
    />
  );
});

/** Same name and meaning as expo-glass-effect's helper: whether real glass can be rendered. */
export const isGlassEffectAPIAvailable = () =>
  typeof CSS !== 'undefined' && (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

export default GlassView;
