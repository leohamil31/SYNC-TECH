import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listAll } from '../admin.api';
import { useI18n } from '../../../shared/i18n';
import { clock } from '../../../shared/lib/format';
import { thumbnailUrl, videoIdFrom } from '../../../shared/lib/youtube';
import PasswordInput from '../../auth/PasswordInput';

/** "12:04" -> 724, "1:02:05" -> 3725, "90" -> 90. Returns NaN for invalid input. */
const parseDuration = (value) => {
  const text = String(value).trim();
  if (!text) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(text)) return NaN;
  return text.split(':').reduce((total, part) => total * 60 + Number(part), 0);
};

const initialValue = (field, record, isNew) => {
  const value = record?.[field.name];
  if (field.type === 'password') return '';
  if (field.type === 'checkbox') return value ?? field.defaultValue ?? false;
  if (field.type === 'duration') return value ? clock(value) : '';
  if (value === null || value === undefined) return isNew ? (field.defaultValue ?? '') : '';
  return value;
};

/**
 * Form generated from a field list (see resources.jsx).
 * Converts values to the API types on submit and shows server-side errors per field.
 */
export default function ResourceForm({ fields, initialValues, isNew, onSubmit, onCancel, submitting, errors = {} }) {
  const { t } = useI18n();
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initialValue(f, initialValues, isNew)])));
  const [options, setOptions] = useState({});
  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    fields
      .filter((f) => f.optionsFrom)
      .forEach((f) => {
        listAll(f.optionsFrom.resource, undefined, controller.signal)
          .then((rows) => setOptions((o) => ({ ...o, [f.name]: rows.map((r) => ({ value: r.id, label: f.optionsFrom.label(r) })) })))
          .catch(() => {});
      });
    return () => controller.abort();
  }, [fields]);

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const submit = (e) => {
    e.preventDefault();
    const problems = {};
    const payload = {};

    fields.forEach((f) => {
      const value = values[f.name];
      switch (f.type) {
        case 'checkbox':
          payload[f.name] = Boolean(value);
          break;
        case 'select':
          payload[f.name] = value === '' ? null : f.optionsFrom ? Number(value) : value;
          break;
        case 'number':
          payload[f.name] = value === '' ? (f.defaultValue ?? null) : Number(value);
          break;
        case 'duration': {
          const seconds = parseDuration(value);
          if (Number.isNaN(seconds) || seconds === 0) problems[f.name] = t('errors.duration');
          payload[f.name] = seconds;
          break;
        }
        case 'password':
          // Blank on edit keeps the current password.
          if (value) payload[f.name] = value;
          break;
        default:
          payload[f.name] = value === '' && !f.required ? null : typeof value === 'string' ? value.trim() : value;
      }
    });

    setLocalErrors(problems);
    if (Object.keys(problems).length === 0) onSubmit(payload);
  };

  const allErrors = { ...errors, ...localErrors };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {fields.map((f) => {
        const id = `field-${f.name}`;
        const required = f.required || (f.requiredOnCreate && isNew);
        const hint = !isNew && f.hintOnEdit ? f.hintOnEdit : f.hint;
        const error = allErrors[f.name];
        const common = {
          id,
          name: f.name,
          required,
          'aria-invalid': Boolean(error),
          'aria-describedby': hint || error ? `${id}-help` : undefined,
        };
        const value = values[f.name];

        if (f.type === 'checkbox') {
          return (
            <div key={f.name} className="field">
              <label className="check">
                <input type="checkbox" {...common} checked={Boolean(value)} onChange={(e) => set(f.name, e.target.checked)} />
                <span>{f.label}</span>
              </label>
              {hint && <small id={`${id}-help`} className="hint">{hint}</small>}
            </div>
          );
        }

        const fieldOptions = f.options || options[f.name] || [];
        const onChange = (e) => set(f.name, e.target.value);
        let control;
        if (f.type === 'textarea') control = <textarea rows={f.rows || 4} {...common} value={value} onChange={onChange} />;
        else if (f.type === 'select') {
          control = (
            <select {...common} value={value} onChange={onChange}>
              <option value="">{t('common.select')}</option>
              {fieldOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          );
        } else if (f.type === 'password') control = <PasswordInput {...common} autoComplete="new-password" value={value} onChange={onChange} />;
        else if (f.type === 'number') control = <input type="number" inputMode="numeric" min={f.min} {...common} value={value} onChange={onChange} />;
        else if (f.type === 'duration') control = <input type="text" inputMode="numeric" placeholder="12:34" {...common} value={value} onChange={onChange} />;
        else if (f.type === 'youtube') control = <input type="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=…" {...common} value={value} onChange={onChange} />;
        else control = <input type={f.type || 'text'} autoComplete={f.autoComplete} {...common} value={value} onChange={onChange} />;

        return (
          <div key={f.name} className={`field${error ? ' has-error' : ''}`}>
            <label htmlFor={id}>
              {f.label}
              {required && <span className="req"> *</span>}
            </label>
            {control}
            {(error || hint) && (
              <small id={`${id}-help`} className={error ? 'error-text' : 'hint'}>
                {error || hint}
              </small>
            )}
            {f.type === 'youtube' && (
              <AnimatePresence>
                {videoIdFrom(value) && (
                  <motion.img
                    key={videoIdFrom(value)}
                    className="video-preview"
                    src={thumbnailUrl(value)}
                    alt={t('hints.videoPreview')}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  />
                )}
              </AnimatePresence>
            )}
          </div>
        );
      })}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t('actions.cancel')}
        </button>
        <button type="submit" className={`btn btn-primary${submitting ? ' is-loading' : ''}`} disabled={submitting}>
          {t('actions.save')}
        </button>
      </div>
    </form>
  );
}
