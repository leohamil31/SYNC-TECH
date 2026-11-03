import { useI18n } from '../../../shared/i18n';
import Icon from '../../../design-system/Icon';

export default function RowActions({ onEdit, onDelete, children }) {
  const { t } = useI18n();
  return (
    <div className="row-actions">
      {children}
      {onEdit && (
        <button type="button" className="icon-btn" onClick={onEdit} title={t('actions.edit')} aria-label={t('actions.edit')}>
          <Icon name="edit" size={16} />
        </button>
      )}
      {onDelete && (
        <button type="button" className="icon-btn icon-btn-danger" onClick={onDelete} title={t('actions.delete')} aria-label={t('actions.delete')}>
          <Icon name="trash" size={16} />
        </button>
      )}
    </div>
  );
}
