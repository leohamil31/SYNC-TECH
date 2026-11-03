import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useI18n } from '../shared/i18n';
import Modal from './Modal';

const ConfirmContext = createContext(async () => false);

/**
 * Promise-based replacement for window.confirm, rendered as a glass dialog:
 *   const confirm = useConfirm();
 *   if (await confirm({ title, message, confirmLabel, danger: true })) { ... }
 */
export function ConfirmProvider({ children }) {
  const { t } = useI18n();
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setRequest(options);
      }),
    [],
  );

  const settle = (value) => {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {request && (
          <Modal key="confirm" size="sm" title={request.title} onClose={() => settle(false)}>
            {request.message && <p className="muted">{request.message}</p>}
            <div className="form-actions" style={{ marginTop: 'var(--s-5)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => settle(false)}>
                {t('actions.cancel')}
              </button>
              <button type="button" className={`btn ${request.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => settle(true)}>
                {request.confirmLabel || t('actions.confirm')}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
