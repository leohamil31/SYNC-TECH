import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api, http, listAll } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { rise, spring } from '../components/motion/variants';

/** Lesson page: shows the content and manages who has watched it. */
export default function ContentDetail() {
  const { id } = useParams();
  const notify = useToast();
  const { t, formatDate, apiMessage } = useI18n();
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, error, reload } = useAsync(async () => {
    const [content, viewers, users] = await Promise.all([
      api.get('contents', id),
      http.get(`/contents/${id}/views`),
      listAll('users'),
    ]);
    return { content, viewers, users };
  }, [id]);

  if (error) return <div className="alert">{apiMessage(error.message)}</div>;
  if (!data) {
    return (
      <div aria-busy="true">
        <span className="skeleton" style={{ width: 260, height: 14, marginBottom: 16 }} />
        <span className="skeleton" style={{ width: '40%', height: 34, marginBottom: 24 }} />
        <div className="panel"><span className="skeleton" /><span className="skeleton" style={{ marginTop: 10, width: '55%' }} /></div>
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const { content, viewers, users } = data;
  const watchedIds = new Set(viewers.map((v) => v.id));
  const available = users.filter((u) => !watchedIds.has(u.id));

  const run = async (action, message) => {
    setBusy(true);
    try {
      await action();
      notify(message);
      reload();
    } catch (err) {
      notify(apiMessage(err.message), 'error');
    } finally {
      setBusy(false);
    }
  };

  const markWatched = (e) => {
    e.preventDefault();
    run(() => http.post(`/contents/${id}/views`, { user_id: Number(userId) }), t('messages.markedWatched')).then(() => setUserId(''));
  };

  return (
    <>
      <motion.nav className="breadcrumb" variants={rise}>
        <Link to="/contents">{t('nav.contents')}</Link>
        <Icon name="chevronRight" size={14} />
        <Link to={`/courses/${content.course_id}`}>{content.course_title}</Link>
        <Icon name="chevronRight" size={14} />
        <span>{content.module_title}</span>
      </motion.nav>
      <PageHeader eyebrow={`#${content.id}`} title={content.title} />
      <motion.article className="panel lesson-body" variants={rise}>{content.content}</motion.article>

      <motion.header className="section-header" variants={rise}>
        <h2>
          {t('contentPage.watchedBy')}{' '}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={viewers.length}
              className="count"
              initial={{ y: -10, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.8 }}
              transition={spring}
            >
              {viewers.length}
            </motion.span>
          </AnimatePresence>
        </h2>
      </motion.header>

      <motion.div className="panel" variants={rise}>
        <form className="toolbar" onSubmit={markWatched}>
          <select
            className={`filter-select${userId ? ' is-active' : ''}`}
            aria-label={t('fields.user')}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          >
            <option value="">{t('contentPage.selectUser')}</option>
            {available.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <motion.button
            type="submit"
            className={`btn btn-primary${busy ? ' is-loading' : ''}`}
            disabled={!userId || busy}
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="eye" size={16} /> {t('actions.markWatched')}
          </motion.button>
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
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={busy}
              onClick={() => run(() => http.delete(`/contents/${id}/views/${row.id}`), t('messages.unmarked'))}
            >
              {t('actions.remove')}
            </button>
          )}
        />
      </motion.div>
    </>
  );
}
