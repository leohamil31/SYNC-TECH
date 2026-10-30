import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEMO, http } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

// Same queries as backend/sql/reports.sql, shown on demand next to each report.
const SQL = {
  '01': `SELECT u.id, u.name, u.email, COUNT(c.id) AS total_courses
FROM users u
LEFT JOIN courses c ON c.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY total_courses DESC, u.name ASC;`,
  '02': `SELECT id, code, title, total_contents
FROM (
  SELECT c.id, c.code, c.title,
         COUNT(ct.id) AS total_contents,
         RANK() OVER (ORDER BY COUNT(ct.id) DESC) AS position
  FROM courses c
  LEFT JOIN modules m ON m.course_id = c.id
  LEFT JOIN contents ct ON ct.module_id = m.id
  GROUP BY c.id, c.code, c.title
) ranked
WHERE position = 1;`,
  '03': `SELECT c.id, c.code, c.title,
       COUNT(DISTINCT m.id) AS total_modules,
       COUNT(ct.id)         AS total_contents
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN contents ct ON ct.module_id = m.id
GROUP BY c.id, c.code, c.title
ORDER BY c.id;`,
  '04': `SELECT ct.id, ct.title AS content_title, m.title AS module_title,
       c.title AS course_title
FROM contents ct
INNER JOIN modules m ON m.id = ct.module_id
INNER JOIN courses c ON c.id = m.course_id
ORDER BY c.id, m.id, ct.id;`,
  '05': `SELECT u.id, u.name, u.email, cv.watched_at
FROM content_views cv
INNER JOIN users u ON u.id = cv.user_id
WHERE cv.content_id = 2
ORDER BY cv.watched_at, u.name;`,
};

const Bar = ({ value, max }) => (
  <span className="bar-cell">
    <span className="bar-track"><span className="bar" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></span>
    <span className="bar-value">{value}</span>
  </span>
);

const maxOf = (rows, key) => Math.max(0, ...rows.map((r) => r[key]));

function Report({ number, title, description, path, columns, children, className = '' }) {
  const { t, apiMessage } = useI18n();
  const [showSql, setShowSql] = useState(false);
  const { data, error, loading } = useAsync(() => http.get(path), [path]);

  return (
    <article className={`panel report ${className}`}>
      <header className="report-header">
        <div>
          <span className="tag">SQL {number}</span>
          <h2>{title}</h2>
          <p className="muted small">{description}</p>
        </div>
        <div className="report-links">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowSql((v) => !v)} aria-expanded={showSql}>
            <Icon name="code" size={14} /> {showSql ? t('reports.hideSql') : t('reports.showSql')}
          </button>
          {!DEMO && (
            <a className="btn btn-sm btn-ghost" href={`/api${path}`} target="_blank" rel="noreferrer">
              JSON <Icon name="external" size={13} />
            </a>
          )}
        </div>
      </header>
      {showSql && <pre className="sql"><code>{SQL[number]}</code></pre>}
      {children}
      {error && <div className="alert">{apiMessage(error.message)}</div>}
      <DataTable columns={columns(data || [])} rows={data || []} loading={loading && !data} />
    </article>
  );
}

function Kpis() {
  const { t } = useI18n();
  const { data } = useAsync(async () => {
    const [users, courses] = await Promise.all([http.get('/reports/users-most-courses'), http.get('/reports/courses-summary')]);
    return {
      users: users.length,
      courses: courses.length,
      modules: courses.reduce((sum, c) => sum + c.total_modules, 0),
      contents: courses.reduce((sum, c) => sum + c.total_contents, 0),
    };
  }, []);

  const items = [
    ['users', 'users', t('reports.kpiUsers'), '/users'],
    ['courses', 'book', t('reports.kpiCourses'), '/courses'],
    ['modules', 'layers', t('reports.kpiModules'), '/modules'],
    ['contents', 'file', t('reports.kpiContents'), '/contents'],
  ];

  return (
    <div className="kpis">
      {items.map(([key, icon, label, to]) => (
        <Link key={key} to={to} className={`kpi kpi-${key}`}>
          <span className="kpi-icon"><Icon name={icon} /></span>
          <div>
            <strong>{data ? data[key] : '–'}</strong>
            <span>{label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Reports() {
  const { t, formatDate } = useI18n();
  const [contentId, setContentId] = useState(2);

  return (
    <section>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <Kpis />

      <div className="report-grid">
        <Report
          number="01"
          title={t('reports.r1Title')}
          description={t('reports.r1Desc')}
          path="/reports/users-most-courses"
          columns={(rows) => [
            { key: 'name', label: t('fields.user'), render: (r) => <span className="cell-user"><Avatar name={r.name} size="sm" />{r.name}</span> },
            { key: 'total_courses', label: t('fields.courses'), render: (r) => <Bar value={r.total_courses} max={maxOf(rows, 'total_courses')} /> },
          ]}
        />
        <Report
          number="02"
          title={t('reports.r2Title')}
          description={t('reports.r2Desc')}
          path="/reports/course-most-contents"
          columns={() => [
            { key: 'title', label: t('fields.course'), render: (r) => (
              <span className="cell-stack"><Link to={`/courses/${r.id}`} className="strong-link">{r.title}</Link><code>{r.code}</code></span>
            ) },
            { key: 'total_contents', label: t('fields.contents'), numeric: true },
          ]}
        />
      </div>

      <Report
        number="03"
        title={t('reports.r3Title')}
        description={t('reports.r3Desc')}
        path="/reports/courses-summary"
        columns={(rows) => [
          { key: 'title', label: t('fields.course'), render: (r) => (
            <span className="cell-stack"><Link to={`/courses/${r.id}`} className="strong-link">{r.title}</Link><code>{r.code}</code></span>
          ) },
          { key: 'total_modules', label: t('fields.modules'), render: (r) => <Bar value={r.total_modules} max={maxOf(rows, 'total_modules')} /> },
          { key: 'total_contents', label: t('fields.contents'), render: (r) => <Bar value={r.total_contents} max={maxOf(rows, 'total_contents')} /> },
        ]}
      />

      <Report
        number="05"
        title={t('reports.r5Title')}
        description={t('reports.r5Desc')}
        path={`/reports/content-viewers/${contentId || 0}`}
        columns={() => [
          { key: 'name', label: t('fields.user'), render: (r) => (
            <span className="cell-user"><Avatar name={r.name} /><span><strong>{r.name}</strong><small>{r.email}</small></span></span>
          ) },
          { key: 'watched_at', label: t('fields.watchedAt'), render: (r) => <span className="muted">{formatDate(r.watched_at)}</span> },
        ]}
      >
        <div className="toolbar">
          <label className="inline-label">
            {t('fields.contentId')}
            <input type="number" min="1" value={contentId} onChange={(e) => setContentId(e.target.value)} />
          </label>
          <Link to={`/contents/${contentId}`} className="btn btn-sm btn-ghost">
            {t('actions.manageViewers')} <Icon name="chevronRight" size={14} />
          </Link>
        </div>
      </Report>

      <Report
        number="04"
        title={t('reports.r4Title')}
        description={t('reports.r4Desc')}
        path="/reports/contents-with-course"
        className="report-scroll"
        columns={() => [
          { key: 'id', label: t('fields.id'), numeric: true },
          { key: 'content_title', label: t('fields.content'), render: (r) => <Link to={`/contents/${r.id}`}>{r.content_title}</Link> },
          { key: 'module_title', label: t('fields.module') },
          { key: 'course_title', label: t('fields.course'), render: (r) => <Link to={`/courses/${r.course_id}`}>{r.course_title}</Link> },
        ]}
      />
    </section>
  );
}
