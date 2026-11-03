import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Icon from '../../../design-system/Icon';
import { ErrorAlert, PageHeader } from '../../../design-system/Feedback';
import { rise } from '../../../design-system/motion/variants';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { adminApi } from '../admin.api';
import { useCrud } from '../hooks/useCrud';
import { useResources } from '../hooks/useResources';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import CrudModal from '../components/CrudModal';
import RowActions from '../components/RowActions';
import FilterSelect from '../components/FilterSelect';
import '../admin.css';

const PAGE_SIZE = 10;

/** Generic list + CRUD screen. Page, search and filters live in the URL, so views are shareable. */
export default function ResourcePage({ name }) {
  const { t, apiMessage } = useI18n();
  const config = useResources()[name];
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');

  const queryKey = params.toString();
  const { data, error, loading, reload } = useAsync(
    (signal) => adminApi.list(name, { limit: PAGE_SIZE, ...Object.fromEntries(params) }, signal),
    [name, queryKey],
  );
  const crud = useCrud(name, config, reload);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: key === 'search' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get('search') || '') !== search.trim()) setParam('search', search.trim());
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      <PageHeader
        title={config.title}
        subtitle={config.description}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => crud.open()}>
            <Icon name="plus" size={16} /> {t('actions.new', { entity: config.singular })}
          </button>
        }
      />

      <GlassView as={motion.div} className="panel" variants={rise}>
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={16} />
            <input
              className="input"
              type="search"
              placeholder={t('common.search', { entity: config.title.toLowerCase() })}
              aria-label={t('common.search', { entity: config.title.toLowerCase() })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {config.filters?.map((f) => (
            <FilterSelect key={f.name} filter={f} value={params.get(f.name)} onChange={(v) => setParam(f.name, v)} />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16 }}>
              <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={loading && data ? 'is-refreshing' : undefined}>
          <DataTable
            columns={config.columns}
            rows={data?.data || []}
            loading={loading}
            actions={(row) => <RowActions onEdit={() => crud.open(row)} onDelete={() => crud.remove(row)} />}
          />
        </div>
        <Pagination meta={data?.meta} onChange={(page) => setParam('page', page)} />
      </GlassView>

      <CrudModal crud={crud} config={config} />
    </>
  );
}
