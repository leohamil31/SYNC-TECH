import { motion } from 'framer-motion';
import { page } from './variants';

/** Wrap each routed page. Pair with <AnimatePresence mode="wait"> in App.jsx. */
export default function PageTransition({ children, ...rest }) {
  return (
    <motion.section variants={page} initial="initial" animate="animate" exit="exit" style={{ transformOrigin: '50% 0%' }} {...rest}>
      {children}
    </motion.section>
  );
}
