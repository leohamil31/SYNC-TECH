import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Avatar from '../../../design-system/Avatar';
import Icon from '../../../design-system/Icon';
import { ErrorAlert, PageHeader, Skeleton } from '../../../design-system/Feedback';
import { useToast } from '../../../design-system/Toast';
import { rise, spring } from '../../../design-system/motion/variants';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { clock } from '../../../shared/lib/format';
import VideoThumb from '../../learner/components/VideoThumb';
import { adminApi, listAll } from '../admin.api';
import { useCrud } from '../hooks/useCrud';
import { useResources } from '../hooks/useResources';
import DataTable from '../components/DataTable';
import CrudModal from '../components/CrudModal';
import '../admin.css';

/** Lesson details for admins: video, metadata and who completed it (with manual marking). */
export default function ContentDetailPage() {
  const { id } = useParams();
  const notify = useToast();
  const { t, formatDate, apiMessage } = useI18n();
  const resources = useResources();
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, error, reload } = useAsync(
    async (signal) => {
      const [content, viewers, users] = await Promise.all([
        adminApi.get('contents', id, signal),
        adminApi.viewers(id, signal),
        listAll('users', undefined, signal),
      ]);
      return { content, viewers, users };
    },
    [id],
  );
  const crud = useCrud('contents', resources.contents, reload);

  if (error && !data) return <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>;
  if (!data) {
    return (
      <div className="stack" aria-busy="true">
        <Skeleton width={260} />
        <Skeleton width="40%" height={34} />
        <Skeleton height={240} style={{ borderRadius: 24 }} />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const { content, viewers, users } = data;
  const completedIds = new Set(viewers.map((v) => v.id));
  const available = users.filter((u) => !completedIds.has(u.id));

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

  const mark = (e) => {
    e.preventDefault();
    run(() => adminApi.markViewed(id, Number(userId)), t('messages.markedCompleted')).then(() => setUserId(''));
  };

  return (
    <>
      <motion.nav className="breadcrumb" variants={rise} aria-label={t('nav.breadcrumb')}>
        <Link to="/admin/contents">{t('nav.lessons')}</Link>
        <Icon name="chevronRight" size={14} />
        <Link to={`/admin/courses/${content.course_id}`}>{content.course_title}</Link>
        <Icon name="chevronRight" size={14} />
        <span>{content.module_title}</span>
      </motion.nav>

      <PageHeader
        title={content.title}
        actions={
          <>
            <Link to={`/app/lessons/${content.id}`} className="btn btn-ghost">
              <Icon name="play" size={14} filled /> {t('actions.preview')}
            </Link>
            <button type="button" className="btn" onClick={() => crud.open(content)}>
              <Icon name="edit" size={16} /> {t('actions.edit')}
            </button>
          </>
        }
      />

      <GlassView as={motion.section} className="panel lesson-admin" variants={rise}>
        <VideoThumb videoUrl={content.video_url} alt={content.title} className="lesson-admin-thumb" />
        <dl className="lesson-admin-meta">
          <div>
            <dt>{t('fields.videoUrl')}</dt>
            <dd>
              {content.video_url ? (
                <a href={content.video_url} target="_blank" rel="noreferrer">
                  {content.video_url.replace('https://www.', '')} <Icon name="external" size={12} />
                </a>
              ) : (
                t('lesson.noVideo')
              )}
            </dd>
          </div>
          <div>
            <dt>{t('fields.duration')}</dt>
            <dd>{content.duration_seconds ? clock(content.duration_seconds) : '—'}</dd>
          </div>
          <div>
            <dt>{t('fields.summary')}</dt>
            <dd className="muted">{content.content}</dd>
          </div>
        </dl>
      </GlassView>

      <header className="section-title">
        <h2>
          {t('contentPage.completedBy')}{' '}
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
      </header>

      <GlassView as={motion.div} className="panel" variants={rise}>
        <form className="toolbar" onSubmit={mark}>
          <select className={userId ? 'is-active' : undefined} aria-label={t('fields.user')} value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">{t('contentPage.selectUser')}</option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button type="submit" className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={!userId || busy}>
            <Icon name="check" size={16} /> {t('actions.markCompleted')}
          </button>
        </form>
        <DataTable
          columns={[
            { key: 'name', label: t('fields.user'), render: (r) => (
              <span className="cell-user"><Avatar name={r.name} /><span><strong>{r.name}</strong><small>{r.email}</small></span></span>
            ) },
            { key: 'completed_at', label: t('fields.completedAt'), render: (r) => <span className="muted">{formatDate(r.completed_at)}</span> },
          ]}
          rows={viewers}
          empty={t('contentPage.nobody')}
          actions={(r) => (
            <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => run(() => adminApi.unmarkViewed(id, r.id), t('messages.unmarked'))}>
              {t('actions.remove')}
            </button>
          )}
        />
      </GlassView>

      <CrudModal crud={crud} config={resources.contents} />
    </>
  );
}
