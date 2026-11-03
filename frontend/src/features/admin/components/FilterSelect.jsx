import { useEffect, useState } from 'react';
import { listAll } from '../admin.api';

/** Filter dropdown. Highlights itself while a value is applied. */
export default function FilterSelect({ filter, value, onChange }) {
  const [loaded, setLoaded] = useState([]);

  useEffect(() => {
    if (!filter.optionsFrom) return undefined;
    const controller = new AbortController();
    listAll(filter.optionsFrom.resource, undefined, controller.signal)
      .then((rows) => setLoaded(rows.map((r) => ({ value: r.id, label: filter.optionsFrom.label(r) }))))
      .catch(() => {});
    return () => controller.abort();
  }, [filter]);

  const options = filter.options || loaded;
  return (
    <select className={value ? 'is-active' : undefined} aria-label={filter.label} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{filter.placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
