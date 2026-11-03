import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Icon from '../../../design-system/Icon';
import { EmptyState, ErrorAlert, PageHeader, Skeleton } from '../../../design-system/Feedback';
import { spring } from '../../../design-system/motion/variants';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { useI18n } from '../../../shared/i18n';
import { courseStatus, learnerApi } from '../learner.api';
import CourseCard from '../components/CourseCard';
import '../learner.css';

const FILTERS = ['all', 'inProgress', 'notStarted', 'completed'];

export default function CatalogPage() {
  const { t, apiMessage } = useI18n();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const query = useDebouncedValue(search.trim(), 300);
  const { data, error, loading, reload } = useAsync((signal) => learnerApi.courses({ search: query || undefined }, signal), [query]);

  const courses = (data || []).filter((c) => filter === 'all' || courseStatus(c) === filter);

  return (
    <>
      <PageHeader title={t('catalog.title')} subtitle={t('catalog.subtitle')} />

      <div className="toolbar catalog-toolbar">
        <label className="search-field">
          <Icon name="search" size={16} />
          <input
            className="input"
            type="search"
            placeholder={t('catalog.search')}
            aria-label={t('catalog.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="segmented" role="tablist" aria-label={t('catalog.filter')}>
          {FILTERS.map((key) => (
            <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}>
              {filter === key && <motion.span layoutId="catalog-filter" className="segmented-thumb" transition={spring} />}
              {t(`catalog.filters.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>}

      {!data && loading ? (
        <ul className="course-grid" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton height={300} style={{ borderRadius: 18 }} />
            </li>
          ))}
        </ul>
      ) : courses.length === 0 ? (
        <GlassView className="panel">
          <EmptyState icon="search" title={t('catalog.emptyTitle')}>
            {query ? t('catalog.emptySearch', { query }) : t('catalog.emptyFilter')}
          </EmptyState>
        </GlassView>
      ) : (
        <motion.ul className={`course-grid${loading ? ' is-refreshing' : ''}`} layout>
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </motion.ul>
      )}
    </>
  );
}
