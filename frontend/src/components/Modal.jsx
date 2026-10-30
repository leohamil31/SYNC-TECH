import { useEffect } from 'react';
import { useI18n } from '../i18n';
import Icon from './Icon';

export default function Modal({ title, onClose, children }) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('actions.close')}>
            <Icon name="x" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
