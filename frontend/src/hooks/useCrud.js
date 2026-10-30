import { useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Shared create/edit/delete flow used by list pages and detail pages:
 * keeps the record being edited, maps API validation errors to fields
 * (translated) and shows feedback toasts.
 */
export function useCrud(resource, config, onChange) {
  const notify = useToast();
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
      if (editing?.id) await api.update(resource, editing.id, payload);
      else await api.create(resource, payload);
      notify(t('messages.saved', { entity: capitalize(config.singular) }));
      close();
      onChange();
    } catch (error) {
      if (Array.isArray(error.details)) {
        setErrors(Object.fromEntries(error.details.map((d) => [d.field, apiMessage(d.message)])));
      }
      notify(apiMessage(error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record, label = record.title || record.name) => {
    if (!window.confirm(t('messages.confirmDelete', { entity: config.singular, name: label }))) return;
    try {
      await api.remove(resource, record.id);
      notify(t('messages.deleted', { entity: capitalize(config.singular) }));
      onChange();
    } catch (error) {
      notify(apiMessage(error.message), 'error');
    }
  };

  return { editing, saving, errors, open, close, save, remove };
}
