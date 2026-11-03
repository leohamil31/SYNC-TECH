import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Avatar from '../../../design-system/Avatar';
import Icon from '../../../design-system/Icon';
import { ErrorAlert, PageHeader } from '../../../design-system/Feedback';
import { ease, rise } from '../../../design-system/motion/variants';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { adminApi } from '../admin.api';
import DataTable from '../components/DataTable';
import '../admin.css';

// Same queries as backend/sql/reports.sql, shown on demand next to each report.
const SQL = {
  'users-most-courses': `SELECT u.id, u.name, u.email, COUNT(c.id) AS total_courses
FROM users u
LEFT JOIN courses c ON c.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY total_courses DESC, u.name ASC;`,
  'courses-summary': `SELECT c.id, c.code, c.title,
       COUNT(DISTINCT m.id) AS total_modules,
       COUNT(ct.id)         AS total_contents
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN contents ct ON ct.module_id = m.id
GROUP BY c.id, c.code, c.title
ORDER BY c.id;`,
  'course-completion': `SELECT c.id, c.code, c.title,
       COUNT(DISTINCT ct.id)      AS total_contents,
       COUNT(DISTINCT cv.user_id) AS learners,
       COUNT(cv.completed_at)     AS completions
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN contents ct ON ct.module_id = m.id
LEFT JOIN content_views cv ON cv.content_id = ct.id
GROUP BY c.id, c.code, c.title
ORDER BY completions DESC, c.id;`,
  'contents-with-course': `SELECT ct.id, ct.title AS content_title, m.title AS module_title,
       c.title AS course_title
FROM contents ct
INNER JOIN modules m ON m.id = ct.module_id
INNER JOIN courses c ON c.id = m.course_id
ORDER BY c.id, m.id, ct.position, ct.id;`,
};

const maxOf = (rows, key) => Math.max(0, ...rows.map((r) => r[key]));

const Bar = ({ value, max }) => (
  <span className="bar-cell">
    <span className="bar-track">
      <motion.span className="bar" initial={{ scaleX: 0 }} animate={{ scaleX: max ? value / max : 0 }} transition={{ duration: 0.8, ease, delay: 0.1 }} />
    </span>
    <span className="bar-value">{value}</span>
  </span>
);

function Report({ name, title, description, columns, className = '' }) {
  const { t, apiMessage } = useI18n();
  const [showSql, setShowSql] = useState(false);
  const { data, error, loading, reload } = useAsync((signal) => adminApi.report(name, signal), [name]);

  return (
    <GlassView as={motion.article} className={`panel report ${className}`} variants={rise}>
      <header className="report-header">
        <div>
          <h2>{title}</h2>
          <p className="muted small">{description}</p>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowSql((v) => !v)} aria-expanded={showSql}>
          <Icon name="code" size={14} /> {showSql ? t('reports.hideSql') : t('reports.showSql')}
        </button>
      </header>
      <AnimatePresence initial={false}>
        {showSql && (
          <motion.pre
            className="sql"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <code>{SQL[name]}</code>
          </motion.pre>
        )}
      </AnimatePresence>
      {error && <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>}
      <DataTable columns={columns(data || [])} rows={data || []} loading={loading && !data} />
    </GlassView>
  );
}

/** Full SQL reports (moved out of the overview to keep the start page focused). */
export default function ReportsPage() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="report-grid">
        <Report
          name="course-completion"
          title={t('reports.completionTitle')}
          description={t('reports.completionDesc')}
          columns={(rows) => [
            { key: 'title', label: t('fields.course'), render: (r) => (
              <span className="cell-stack"><Link to={`/admin/courses/${r.id}`}>{r.title}</Link><code>{r.code}</code></span>
            ) },
            { key: 'learners', label: t('fields.learners'), numeric: true },
            { key: 'completions', label: t('fields.completions'), render: (r) => <Bar value={r.completions} max={maxOf(rows, 'completions')} /> },
          ]}
        />
        <Report
          name="users-most-courses"
          title={t('reports.authorsTitle')}
          description={t('reports.authorsDesc')}
          columns={(rows) => [
            { key: 'name', label: t('fields.user'), render: (r) => <span className="cell-user"><Avatar name={r.name} size="sm" />{r.name}</span> },
            { key: 'total_courses', label: t('fields.courses'), render: (r) => <Bar value={r.total_courses} max={maxOf(rows, 'total_courses')} /> },
          ]}
        />
      </div>

      <Report
        name="courses-summary"
        title={t('reports.summaryTitle')}
        description={t('reports.summaryDesc')}
        columns={(rows) => [
          { key: 'title', label: t('fields.course'), render: (r) => (
            <span className="cell-stack"><Link to={`/admin/courses/${r.id}`}>{r.title}</Link><code>{r.code}</code></span>
          ) },
          { key: 'total_modules', label: t('fields.modules'), render: (r) => <Bar value={r.total_modules} max={maxOf(rows, 'total_modules')} /> },
          { key: 'total_contents', label: t('fields.lessons'), render: (r) => <Bar value={r.total_contents} max={maxOf(rows, 'total_contents')} /> },
        ]}
      />

      <Report
        name="contents-with-course"
        title={t('reports.lessonsTitle')}
        description={t('reports.lessonsDesc')}
        className="report-scroll"
        columns={() => [
          { key: 'content_title', label: t('fields.lesson'), render: (r) => <Link to={`/admin/contents/${r.id}`}>{r.content_title}</Link> },
          { key: 'module_title', label: t('fields.module') },
          { key: 'course_title', label: t('fields.course'), render: (r) => <Link to={`/admin/courses/${r.course_id}`}>{r.course_title}</Link> },
        ]}
      />
    </>
  );
}
