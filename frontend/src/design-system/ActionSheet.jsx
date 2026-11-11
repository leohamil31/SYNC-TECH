import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { haptic } from '../shared/lib/haptics';

/**
 * iOS-style action sheet: slides up from the bottom over a dimmed backdrop.
 * Close by tapping outside, pressing Escape, or dragging the sheet down.
 */
export default function ActionSheet({ open, onClose, title, children, closeLabel = 'Close' }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    haptic(6);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const previous = document.activeElement;
    sheetRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div
            className="sheet-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="sheet"
            initial={{ y: '110%' }}
            animate={{ y: 0, transition: { type: 'spring', stiffness: 420, damping: 38 } }}
            exit={{ y: '110%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDragEnd={(_, info) => (info.offset.y > 90 || info.velocity.y > 600) && onClose()}
          >
            <span className="sheet-grabber" aria-hidden="true" />
            <div className="sheet-group">
              {title && <div className="sheet-title">{title}</div>}
              {children}
            </div>
            <button type="button" className="sheet-cancel" onClick={onClose}>
              {closeLabel}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
