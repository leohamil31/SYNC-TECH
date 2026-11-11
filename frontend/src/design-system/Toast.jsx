import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';
import { haptic } from '../shared/lib/haptics';

const ToastContext = createContext(() => {});
const DURATION = 4000;

/*
 * "Dynamic Island" notifications: each toast is born as a small black pill at the
 * top of the screen and morphs open (width first, then content), then shrinks back
 * into the pill when it leaves. Swipe up to dismiss.
 */
const island = {
  initial: { opacity: 0, y: -14, scaleX: 0.32, scaleY: 0.7 },
  animate: {
    opacity: 1,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    transition: { type: 'spring', stiffness: 380, damping: 26, mass: 0.9, staggerChildren: 0.05, delayChildren: 0.12 },
  },
  exit: { opacity: 0, y: -10, scaleX: 0.32, scaleY: 0.7, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
};
const content = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};
// Symbol effect: the icon bounces in once the island has opened.
const symbol = {
  initial: { scale: 0, rotate: -30 },
  animate: { scale: [0, 1.25, 1], rotate: 0, transition: { duration: 0.5, delay: 0.15 } },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);
  const dismiss = useCallback((id) => setToasts((list) => list.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (message, type = 'success') => {
      seq.current += 1;
      const id = seq.current;
      setToasts((list) => [...list.slice(-2), { id, message, type }]);
      haptic(type === 'error' ? [12, 60, 12] : 10);
      setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout
              className={`toast island toast-${item.type}`}
              variants={island}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.6, bottom: 0.1 }}
              onDragEnd={(_, info) => info.offset.y < -30 && dismiss(item.id)}
            >
              <motion.span className="toast-icon" variants={symbol}>
                <Icon name={item.type === 'error' ? 'alert' : 'checkCircle'} />
              </motion.span>
              <motion.span className="toast-text" variants={content}>
                {item.message}
              </motion.span>
              <motion.button
                type="button"
                className="icon-btn toast-close"
                aria-label="Dismiss"
                variants={content}
                onClick={() => dismiss(item.id)}
              >
                <Icon name="x" size={14} />
              </motion.button>
              <svg className="toast-timer" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="8" />
                <motion.circle
                  cx="10"
                  cy="10"
                  r="8"
                  initial={{ pathLength: 1 }}
                  animate={{ pathLength: 0 }}
                  transition={{ duration: DURATION / 1000, ease: 'linear' }}
                />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
