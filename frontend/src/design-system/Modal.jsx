import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useI18n } from '../shared/i18n';
import { backdrop, dialog } from './motion/variants';
import GlassView from './GlassView';
import Icon from './Icon';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Glass dialog (bottom sheet on phones). Render inside <AnimatePresence>
 * so the exit animation plays before unmount.
 */
export default function Modal({ title, onClose, children, size }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const first = ref.current?.querySelector('input, select, textarea') || ref.current?.querySelector(FOCUSABLE);
    first?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && ref.current) {
        const nodes = [...ref.current.querySelectorAll(FOCUSABLE)];
        const [a, z] = [nodes[0], nodes[nodes.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <motion.div
      className="modal-backdrop"
      variants={backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <GlassView
        as={motion.div}
        ref={ref}
        className={`modal${size === 'sm' ? ' modal-sm' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        variants={dialog}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('actions.close')}>
            <Icon name="x" />
          </button>
        </header>
        {children}
      </GlassView>
    </motion.div>,
    document.body,
  );
}
