import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useCrud } from '../hooks/useCrud';
import { resources } from '../resources';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import CrudModal from '../components/CrudModal';
import RowActions from '../components/RowActions';
import FilterSelect from '../components/FilterSelect';

/** Generic list + CRUD screen. Page, search and filters live in the URL. */
export default function ResourcePage({ name }) {
  const config = resources[name];
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');

  const query = Object.fromEntries(params);
  const queryKey = params.toString();
  const { data, error, loading, reload } = useAsync(() => api.list(name, { limit: 10, ...query }), [name, queryKey]);
  const crud = useCrud(name, config, reload);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  // Debounced search to avoid one request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get('search') || '') !== search) setParam('search', search);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <section>
      <header className="page-header">
        <h1>{config.title}</h1>
        <button type="button" className="btn btn-primary" onClick={() => crud.open()}>
          + New {config.singular}
        </button>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder={`Search ${config.title.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search"
        />
        {config.filters?.map((f) => (
          <FilterSelect key={f.name} filter={f} value={params.get(f.name)} onChange={(v) => setParam(f.name, v)} />
        ))}
      </div>

      {error && <div className="alert">{error.message}</div>}
      <div className={loading ? 'loading' : undefined}>
        <DataTable
          columns={config.columns}
          rows={data?.data || []}
          actions={(row) => <RowActions onEdit={() => crud.open(row)} onDelete={() => crud.remove(row)} />}
        />
      </div>
      <Pagination meta={data?.meta} onChange={(page) => setParam('page', page)} />

      <CrudModal crud={crud} config={config} />
    </section>
  );
}
