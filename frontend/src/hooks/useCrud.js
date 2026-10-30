import { useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

/**
 * Shared create/edit/delete flow used by list pages and detail pages:
 * keeps the record being edited, maps API validation errors to fields
 * and shows feedback toasts.
 */
export function useCrud(resource, config, onChange) {
  const notify = useToast();
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
      notify(`${capitalize(config.singular)} saved`);
      close();
      onChange();
    } catch (error) {
      if (Array.isArray(error.details)) {
        setErrors(Object.fromEntries(error.details.map((d) => [d.field, d.message])));
      }
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record, label = record.title || record.name) => {
    if (!window.confirm(`Delete ${config.singular} "${label}"?`)) return;
    try {
      await api.remove(resource, record.id);
      notify(`${capitalize(config.singular)} deleted`);
      onChange();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return { editing, saving, errors, open, close, save, remove };
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
