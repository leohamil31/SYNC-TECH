import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEMO, http } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../resources';
import DataTable from '../components/DataTable';

const Bar = ({ value, max }) => (
  <span className="bar-cell">
    <span className="bar" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    <span className="bar-value">{value}</span>
  </span>
);

function Report({ number, title, description, path, columns, children }) {
  const { data, error, loading } = useAsync(() => http.get(path), [path]);
  return (
    <article className="card report">
      <header className="card-header">
        <div>
          <span className="tag">SQL {number}</span>
          <h2>{title}</h2>
          <p className="muted small">{description}</p>
        </div>
        {!DEMO && <a className="muted small" href={`/api${path}`} target="_blank" rel="noreferrer">JSON ↗</a>}
      </header>
      {children}
      {error && <div className="alert">{error.message}</div>}
      {loading && !data ? <p className="muted">Loading…</p> : <DataTable columns={columns(data || [])} rows={data || []} />}
    </article>
  );
}

const maxOf = (rows, key) => Math.max(0, ...rows.map((r) => r[key]));

export default function Reports() {
  const [contentId, setContentId] = useState(2);

  return (
    <section>
      <header className="page-header">
        <h1>Reports</h1>
      </header>

      <div className="report-grid">
        <Report
          number="01"
          title="Users with the most courses"
          description="All users ranked by the number of courses they created."
          path="/reports/users-most-courses"
          columns={(rows) => [
            { key: 'name', label: 'User' },
            { key: 'email', label: 'Email' },
            { key: 'total_courses', label: 'Courses', render: (r) => <Bar value={r.total_courses} max={maxOf(rows, 'total_courses')} /> },
          ]}
        />
        <Report
          number="02"
          title="Course with the most contents"
          description="Ties are listed together."
          path="/reports/course-most-contents"
          columns={() => [
            { key: 'code', label: 'Code', render: (r) => <code>{r.code}</code> },
            { key: 'title', label: 'Course', render: (r) => <Link to={`/courses/${r.id}`}>{r.title}</Link> },
            { key: 'total_contents', label: 'Contents', numeric: true },
          ]}
        />
      </div>

      <Report
        number="03"
        title="Courses with total of modules and contents"
        description="Single query using LEFT JOINs and COUNT(DISTINCT)."
        path="/reports/courses-summary"
        columns={(rows) => [
          { key: 'code', label: 'Code', render: (r) => <code>{r.code}</code> },
          { key: 'title', label: 'Course', render: (r) => <Link to={`/courses/${r.id}`}>{r.title}</Link> },
          { key: 'total_modules', label: 'Modules', render: (r) => <Bar value={r.total_modules} max={maxOf(rows, 'total_modules')} /> },
          { key: 'total_contents', label: 'Contents', render: (r) => <Bar value={r.total_contents} max={maxOf(rows, 'total_contents')} /> },
        ]}
      />

      <Report
        number="05"
        title="Users who watched a content"
        description="Uses the content_views table (user × content)."
        path={`/reports/content-viewers/${contentId || 0}`}
        columns={() => [
          { key: 'name', label: 'User' },
          { key: 'email', label: 'Email' },
          { key: 'watched_at', label: 'Watched at', render: (r) => formatDate(r.watched_at) },
        ]}
      >
        <label className="inline-form">
          Content ID
          <input type="number" min="1" value={contentId} onChange={(e) => setContentId(e.target.value)} />
          <Link to={`/contents/${contentId}`} className="small">Manage viewers →</Link>
        </label>
      </Report>

      <Report
        number="04"
        title="Contents with course name"
        description="Every content joined with its module and course."
        path="/reports/contents-with-course"
        columns={() => [
          { key: 'id', label: 'ID', numeric: true },
          { key: 'content_title', label: 'Content', render: (r) => <Link to={`/contents/${r.id}`}>{r.content_title}</Link> },
          { key: 'module_title', label: 'Module' },
          { key: 'course_title', label: 'Course', render: (r) => <Link to={`/courses/${r.course_id}`}>{r.course_title}</Link> },
        ]}
      />
    </section>
  );
}
