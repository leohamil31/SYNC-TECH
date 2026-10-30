import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, http, listAll } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../components/Toast';
import { formatDate } from '../resources';
import DataTable from '../components/DataTable';

/** Lesson page: shows the content and manages who has watched it. */
export default function ContentDetail() {
  const { id } = useParams();
  const notify = useToast();
  const [userId, setUserId] = useState('');

  const { data, error, reload } = useAsync(async () => {
    const [content, viewers, users] = await Promise.all([
      api.get('contents', id),
      http.get(`/contents/${id}/views`),
      listAll('users'),
    ]);
    return { content, viewers, users };
  }, [id]);

  if (error) return <div className="alert">{error.message}</div>;
  if (!data) return <p className="muted">Loading…</p>;

  const { content, viewers, users } = data;
  const watchedIds = new Set(viewers.map((v) => v.id));
  const available = users.filter((u) => !watchedIds.has(u.id));

  const markWatched = async (e) => {
    e.preventDefault();
    try {
      await http.post(`/contents/${id}/views`, { user_id: Number(userId) });
      setUserId('');
      notify('Marked as watched');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const unmark = async (viewer) => {
    try {
      await http.delete(`/contents/${id}/views/${viewer.id}`);
      notify('Watch mark removed');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <section>
      <p className="breadcrumb">
        <Link to="/contents">Contents</Link> › <Link to={`/courses/${content.course_id}`}>{content.course_title}</Link> › {content.module_title}
      </p>
      <header className="page-header">
        <h1>{content.title} <span className="muted small">#{content.id}</span></h1>
      </header>
      <article className="card lesson">{content.content}</article>

      <header className="section-header">
        <h2>Watched by ({viewers.length})</h2>
      </header>
      <form className="inline-form" onSubmit={markWatched}>
        <select aria-label="User" value={userId} onChange={(e) => setUserId(e.target.value)} required>
          <option value="">Select a user…</option>
          {available.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <button type="submit" className="btn btn-primary" disabled={!userId}>Mark as watched</button>
      </form>
      <DataTable
        columns={[
          { key: 'id', label: 'User ID', numeric: true },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'watched_at', label: 'Watched at', render: (r) => formatDate(r.watched_at) },
        ]}
        rows={viewers}
        empty="Nobody has watched this content yet."
        actions={(row) => <button type="button" className="btn btn-sm" onClick={() => unmark(row)}>Remove</button>}
      />
    </section>
  );
}
