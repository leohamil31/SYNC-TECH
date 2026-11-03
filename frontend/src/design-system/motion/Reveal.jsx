import { motion } from 'framer-motion';
import { ease } from './variants';

/**
 * Fades and lifts its content the first time it scrolls into view.
 * `delay` staggers siblings; `as` picks the element (default div).
 */
export default function Reveal({ as = 'div', delay = 0, y = 24, children, ...rest }) {
  const Component = motion[as];
  return (
    <Component
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.6, ease, delay }}
      {...rest}
    >
      {children}
    </Component>
  );
}
