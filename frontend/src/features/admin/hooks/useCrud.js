import { useState } from 'react';
import { adminApi } from '../admin.api';
import { useToast } from '../../../design-system/Toast';
import { useConfirm } from '../../../design-system/Confirm';
import { useI18n } from '../../../shared/i18n';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Create/edit/delete flow shared by list and detail pages: keeps the record being edited,
 * maps API validation errors to form fields (translated) and shows feedback.
 */
export function useCrud(resource, config, onChange) {
  const notify = useToast();
  const confirm = useConfirm();
  const { t, apiMessage } = useI18n();
  const [editing, setEditing] = useState(null); // null | {} (new) | record
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const open = (record = {}) => {
    setErrors({});
    setEditing(record);
  };
  const close = () => setEditing(null);

  const save = async (payload) => {
    setSaving(true);
    try {
      const saved = editing?.id ? await adminApi.update(resource, editing.id, payload) : await adminApi.create(resource, payload);
      notify(t('messages.saved', { entity: capitalize(config.singular) }));
      close();
      onChange?.(saved);
    } catch (error) {
      if (Array.isArray(error.details)) {
        setErrors(Object.fromEntries(error.details.map((d) => [d.field, apiMessage(d.message)])));
      }
      notify(apiMessage(error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    const name = config.deleteLabel ? config.deleteLabel(record) : record.title || record.name;
    const ok = await confirm({
      title: t('messages.confirmDeleteTitle', { entity: config.singular }),
      message: t('messages.confirmDelete', { name }),
      confirmLabel: t('actions.delete'),
      danger: true,
    });
    if (!ok) return false;
    try {
      await adminApi.remove(resource, record.id);
      notify(t('messages.deleted', { entity: capitalize(config.singular) }));
      onChange?.();
      return true;
    } catch (error) {
      notify(apiMessage(error.message), 'error');
      return false;
    }
  };

  return { editing, saving, errors, open, close, save, remove };
}
