import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n';
import { spring } from './motion/variants';
import Icon from './Icon';

export default function Pagination({ meta, onChange }) {
  const { t } = useI18n();
  if (!meta) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted small">{t('common.records', { count: meta.total })}</span>
      {meta.total_pages > 1 && (
        <div className="pagination-controls">
          <motion.button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={meta.page <= 1}
            onClick={() => onChange(meta.page - 1)}
            whileTap={{ x: -3 }}
          >
            <Icon name="chevronLeft" size={16} /> {t('actions.previous')}
          </motion.button>
          <span className="pagination-page small" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={meta.page}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={spring}
              >
                {t('common.page', { page: meta.page, total: meta.total_pages })}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={meta.page >= meta.total_pages}
            onClick={() => onChange(meta.page + 1)}
            whileTap={{ x: 3 }}
          >
            {t('actions.next')} <Icon name="chevronRight" size={16} />
          </motion.button>
        </div>
      )}
    </nav>
  );
}
