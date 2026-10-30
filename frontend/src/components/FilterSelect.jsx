import { useEffect, useState } from 'react';
import { listAll } from '../api/client';

export default function FilterSelect({ filter, value, onChange }) {
  const [options, setOptions] = useState(filter.options || []);

  useEffect(() => {
    if (!filter.optionsFrom) return;
    listAll(filter.optionsFrom.resource).then((rows) =>
      setOptions(rows.map((r) => ({ value: r.id, label: filter.optionsFrom.label(r) }))),
    );
  }, [filter]);

  return (
    <select aria-label={filter.label} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{filter.placeholder || `All ${filter.label.toLowerCase()}s`}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
