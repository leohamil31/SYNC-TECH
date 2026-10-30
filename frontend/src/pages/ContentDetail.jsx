import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, http, listAll } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

/** Lesson page: shows the content and manages who has watched it. */
export default function ContentDetail() {
  const { id } = useParams();
  const notify = useToast();
  const { t, formatDate, apiMessage } = useI18n();
  const [userId, setUserId] = useState('');

  const { data, error, reload } = useAsync(async () => {
    const [content, viewers, users] = await Promise.all([
      api.get('contents', id),
      http.get(`/contents/${id}/views`),
      listAll('users'),
    ]);
    return { content, viewers, users };
  }, [id]);

  if (error) return <div className="alert">{apiMessage(error.message)}</div>;
  if (!data) return <p className="muted">{t('common.loading')}</p>;

  const { content, viewers, users } = data;
  const watchedIds = new Set(viewers.map((v) => v.id));
  const available = users.filter((u) => !watchedIds.has(u.id));

  const run = async (action, message) => {
    try {
      await action();
      notify(message);
      reload();
    } catch (err) {
      notify(apiMessage(err.message), 'error');
    }
  };

  const markWatched = (e) => {
    e.preventDefault();
    run(() => http.post(`/contents/${id}/views`, { user_id: Number(userId) }), t('messages.markedWatched')).then(() => setUserId(''));
  };

  return (
    <section>
      <nav className="breadcrumb">
        <Link to="/contents">{t('nav.contents')}</Link>
        <Icon name="chevronRight" size={14} />
        <Link to={`/courses/${content.course_id}`}>{content.course_title}</Link>
        <Icon name="chevronRight" size={14} />
        <span>{content.module_title}</span>
      </nav>
      <PageHeader eyebrow={`#${content.id}`} title={content.title} />
      <article className="panel lesson-body">{content.content}</article>

      <header className="section-header">
        <h2>{t('contentPage.watchedBy')} <span className="count">{viewers.length}</span></h2>
      </header>
      <div className="panel">
        <form className="toolbar" onSubmit={markWatched}>
          <select className="filter-select" aria-label={t('fields.user')} value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">{t('contentPage.selectUser')}</option>
            {available.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button type="submit" className="btn btn-primary" disabled={!userId}>
            <Icon name="eye" size={16} /> {t('actions.markWatched')}
          </button>
        </form>
        <DataTable
          columns={[
            { key: 'name', label: t('fields.user'), render: (r) => (
              <span className="cell-user"><Avatar name={r.name} /><span><strong>{r.name}</strong><small>{r.email}</small></span></span>
            ) },
            { key: 'watched_at', label: t('fields.watchedAt'), render: (r) => <span className="muted">{formatDate(r.watched_at)}</span> },
          ]}
          rows={viewers}
          empty={t('contentPage.nobody')}
          actions={(row) => (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => run(() => http.delete(`/contents/${id}/views/${row.id}`), t('messages.unmarked'))}>
              {t('actions.remove')}
            </button>
          )}
        />
      </div>
    </section>
  );
}
