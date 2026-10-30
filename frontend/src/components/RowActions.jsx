import { useI18n } from '../i18n';
import Icon from './Icon';

export default function RowActions({ onEdit, onDelete, children }) {
  const { t } = useI18n();
  return (
    <div className="row-actions">
      {children}
      <button type="button" className="icon-btn" onClick={onEdit} title={t('actions.edit')} aria-label={t('actions.edit')}>
        <Icon name="edit" size={16} />
      </button>
      <button type="button" className="icon-btn icon-btn-danger" onClick={onDelete} title={t('actions.delete')} aria-label={t('actions.delete')}>
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}
