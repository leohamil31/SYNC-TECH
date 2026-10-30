import { useEffect, useState } from 'react';
import { listAll } from '../api/client';

export default function FilterSelect({ filter, value, onChange }) {
  const [loaded, setLoaded] = useState([]);

  useEffect(() => {
    if (!filter.optionsFrom) return;
    listAll(filter.optionsFrom.resource).then((rows) =>
      setLoaded(rows.map((r) => ({ value: r.id, label: filter.optionsFrom.label(r) }))),
    );
  }, [filter]);

  const options = filter.options || loaded;
  return (
    <select className="filter-select" aria-label={filter.label} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{filter.placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
