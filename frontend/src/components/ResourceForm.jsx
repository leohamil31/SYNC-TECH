import { useEffect, useState } from 'react';
import { listAll } from '../api/client';

/**
 * Form driven by a field definition list:
 * { name, label, type: text|email|textarea|select, required, options?, optionsFrom? }
 * `optionsFrom` loads <select> options from another API resource.
 */
export default function ResourceForm({ fields, initialValues, onSubmit, onCancel, submitting, errors = {} }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, initialValues?.[f.name] ?? f.defaultValue ?? ''])),
  );
  const [options, setOptions] = useState({});

  useEffect(() => {
    fields
      .filter((f) => f.optionsFrom)
      .forEach((f) => {
        listAll(f.optionsFrom.resource).then((rows) =>
          setOptions((o) => ({
            ...o,
            [f.name]: rows.map((r) => ({ value: r.id, label: f.optionsFrom.label(r) })),
          })),
        );
      });
  }, [fields]);

  const change = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(
      fields.map((f) => {
        const value = values[f.name];
        if (f.type === 'select' && f.optionsFrom) return [f.name, value === '' ? null : Number(value)];
        return [f.name, value === '' && !f.required ? null : value];
      }),
    );
    onSubmit(payload);
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {fields.map((f) => {
        const id = `field-${f.name}`;
        const fieldOptions = f.options || options[f.name] || [];
        const common = { id, name: f.name, value: values[f.name], onChange: change(f.name), required: f.required };
        return (
          <div key={f.name} className={`field${errors[f.name] ? ' has-error' : ''}`}>
            <label htmlFor={id}>{f.label}{f.required && <span className="req"> *</span>}</label>
            {f.type === 'textarea' && <textarea rows={f.rows || 4} {...common} />}
            {f.type === 'select' && (
              <select {...common}>
                <option value="">Select…</option>
                {fieldOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
            {!['textarea', 'select'].includes(f.type) && <input type={f.type || 'text'} {...common} />}
            {errors[f.name] && <small className="error-text">{errors[f.name]}</small>}
          </div>
        );
      })}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
