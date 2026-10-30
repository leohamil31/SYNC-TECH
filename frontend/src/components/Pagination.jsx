import { useI18n } from '../i18n';
import Icon from './Icon';

export default function Pagination({ meta, onChange }) {
  const { t } = useI18n();
  if (!meta) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted small">{t('common.records', { count: meta.total })}</span>
      {meta.total_pages > 1 && (
        <div className="pagination-controls">
          <button type="button" className="btn btn-ghost btn-sm" disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)}>
            <Icon name="chevronLeft" size={16} /> {t('actions.previous')}
          </button>
          <span className="small">{t('common.page', { page: meta.page, total: meta.total_pages })}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={meta.page >= meta.total_pages} onClick={() => onChange(meta.page + 1)}>
            {t('actions.next')} <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}
