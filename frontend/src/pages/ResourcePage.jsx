import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useCrud } from '../hooks/useCrud';
import { useResources } from '../hooks/useResources';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import CrudModal from '../components/CrudModal';
import RowActions from '../components/RowActions';
import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';

/** Generic list + CRUD screen. Page, search and filters live in the URL. */
export default function ResourcePage({ name }) {
  const { t, apiMessage } = useI18n();
  const config = useResources()[name];
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
      <PageHeader
        title={config.title}
        subtitle={config.description}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => crud.open()}>
            <Icon name="plus" size={16} /> {t('actions.new', { entity: config.singular })}
          </button>
        }
      />

      <div className="panel">
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder={t('common.search', { entity: config.title.toLowerCase() })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('common.search', { entity: config.title.toLowerCase() })}
            />
          </label>
          {config.filters?.map((f) => (
            <FilterSelect key={f.name} filter={f} value={params.get(f.name)} onChange={(v) => setParam(f.name, v)} />
          ))}
        </div>

        {error && <div className="alert">{apiMessage(error.message)}</div>}
        <div className={loading && data ? 'is-refreshing' : undefined}>
          <DataTable
            columns={config.columns}
            rows={data?.data || []}
            loading={loading}
            actions={(row) => <RowActions onEdit={() => crud.open(row)} onDelete={() => crud.remove(row)} />}
          />
        </div>
        <Pagination meta={data?.meta} onChange={(page) => setParam('page', page)} />
      </div>

      <CrudModal crud={crud} config={config} />
    </section>
  );
}
