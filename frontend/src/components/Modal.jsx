import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n';
import { backdrop, dialog } from './motion/variants';
import Icon from './Icon';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Glass dialog with a 3D "lift" entrance. Render it inside <AnimatePresence>
 * (CrudModal does this) so the exit animation plays before unmount.
 */
export default function Modal({ title, onClose, children }) {
  const { t } = useI18n();
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const first = ref.current?.querySelector('input, select, textarea') || ref.current?.querySelector(FOCUSABLE);
    first?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // Minimal focus trap
        const nodes = [...ref.current.querySelectorAll(FOCUSABLE)];
        const [a, z] = [nodes[0], nodes[nodes.length - 1]];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      className="modal-backdrop"
      variants={backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} variants={dialog}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('actions.close')}>
            <Icon name="x" />
          </button>
        </header>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
