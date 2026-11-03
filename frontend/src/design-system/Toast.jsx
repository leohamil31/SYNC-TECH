import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast as toastVariants } from './motion/variants';
import GlassView from './GlassView';
import Icon from './Icon';

const ToastContext = createContext(() => {});
const DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);
  const dismiss = useCallback((id) => setToasts((list) => list.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (message, type = 'success') => {
      seq.current += 1;
      const id = seq.current;
      setToasts((list) => [...list.slice(-3), { id, message, type }]);
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
            <GlassView
              as={motion.div}
              key={item.id}
              layout
              className={`toast toast-${item.type}`}
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.6 }}
              onDragEnd={(_, info) => info.offset.x > 80 && dismiss(item.id)}
            >
              <Icon name={item.type === 'error' ? 'alert' : 'checkCircle'} className="toast-icon" />
              <span>{item.message}</span>
              <button type="button" className="icon-btn toast-close" aria-label="Dismiss" onClick={() => dismiss(item.id)}>
                <Icon name="x" size={14} />
              </button>
              <motion.span
                className="toast-progress"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: DURATION / 1000, ease: 'linear' }}
              />
            </GlassView>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
