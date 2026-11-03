import { motion } from 'framer-motion';
import { page } from './variants';

/** Wrap each routed page. Pair with <AnimatePresence mode="wait"> in the layout. */
export default function PageTransition({ children, ...rest }) {
  return (
    <motion.section variants={page} initial="initial" animate="animate" exit="exit" {...rest}>
      {children}
    </motion.section>
  );
}
