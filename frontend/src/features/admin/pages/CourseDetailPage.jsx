import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Avatar from '../../../design-system/Avatar';
import Icon from '../../../design-system/Icon';
import { EmptyState, ErrorAlert, PageHeader, Skeleton } from '../../../design-system/Feedback';
import { useToast } from '../../../design-system/Toast';
import { ease, rise, row } from '../../../design-system/motion/variants';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { clock } from '../../../shared/lib/format';
import { thumbnailUrl } from '../../../shared/lib/youtube';
import { adminApi, listAll } from '../admin.api';
import { useCrud } from '../hooks/useCrud';
import { useResources } from '../hooks/useResources';
import CrudModal from '../components/CrudModal';
import RowActions from '../components/RowActions';
import '../admin.css';

/** Course editor: details, publish state, modules and their lessons, all editable in place. */
export default function CourseDetailPage() {
  const { id } = useParams();
  const courseId = Number(id);
  const navigate = useNavigate();
  const notify = useToast();
  const { t, formatDate, apiMessage } = useI18n();
  const resources = useResources();

  const { data, error, reload } = useAsync(
    async (signal) => {
      const [course, modules, contents] = await Promise.all([
        adminApi.get('courses', courseId, signal),
        listAll('modules', { course_id: courseId }, signal),
        listAll('contents', { course_id: courseId }, signal),
      ]);
      return { course, modules, contents };
    },
    [courseId],
  );

  const courseCrud = useCrud('courses', resources.courses, reload);
  const moduleCrud = useCrud('modules', resources.modules, reload);
  const contentCrud = useCrud('contents', resources.contents, reload);

  if (error && !data) return <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>;
  if (!data) {
    return (
      <div className="stack" aria-busy="true">
        <Skeleton width={120} />
        <Skeleton width="45%" height={36} />
        {[0, 1, 2].map((i) => <Skeleton key={i} height={120} style={{ borderRadius: 24 }} />)}
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const { course, modules, contents } = data;

  const deleteCourse = async () => {
    if (await courseCrud.remove(course)) navigate('/admin/courses');
  };

  const togglePublished = async () => {
    try {
      await adminApi.patch('courses', course.id, { published: !course.published });
      notify(course.published ? t('messages.unpublished') : t('messages.published'));
      reload();
    } catch (err) {
      notify(apiMessage(err.message), 'error');
    }
  };

  return (
    <>
      <motion.nav className="breadcrumb" variants={rise} aria-label={t('nav.breadcrumb')}>
        <Link to="/admin/courses">{t('nav.courses')}</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{course.code}</span>
      </motion.nav>

      <PageHeader
        title={course.title}
        subtitle={course.description}
        actions={
          <>
            <Link to={`/app/courses/${course.id}`} className="btn btn-ghost">
              <Icon name="eye" size={16} /> {t('actions.preview')}
            </Link>
            <button type="button" className="btn" onClick={togglePublished}>
              <Icon name={course.published ? 'eyeOff' : 'checkCircle'} size={16} />
              {course.published ? t('actions.unpublish') : t('actions.publish')}
            </button>
            <button type="button" className="btn" onClick={() => courseCrud.open(course)}>
              <Icon name="edit" size={16} /> {t('actions.edit')}
            </button>
            <button type="button" className="btn btn-danger" onClick={deleteCourse}>
              <Icon name="trash" size={16} /> {t('actions.delete')}
            </button>
          </>
        }
      />

      <motion.div className="meta-row" variants={rise}>
        <span className={`badge ${course.published ? 'badge-active' : 'badge-draft'}`}>
          {course.published ? t('status.published') : t('status.draft')}
        </span>
        <span className="cell-user">
          <Avatar name={course.user_name} size="sm" /> {t('course.createdBy', { name: course.user_name })}
        </span>
        <span className="muted">{t('course.updatedAt', { date: formatDate(course.updated_at) })}</span>
        <span className="muted">
          {t('course.modulesAndLessons', { modules: course.modules_count, lessons: course.contents_count })}
        </span>
      </motion.div>

      <header className="section-title">
        <h2>{t('course.modulesTitle')}</h2>
        <button type="button" className="btn btn-primary" onClick={() => moduleCrud.open({ course_id: course.id, user_id: course.user_id })}>
          <Icon name="plus" size={16} /> {t('actions.new', { entity: resources.modules.singular })}
        </button>
      </header>

      {modules.length === 0 && (
        <GlassView className="panel">
          <EmptyState icon="layers" title={t('course.noModules')}>
            {t('course.noModulesHint')}
          </EmptyState>
        </GlassView>
      )}

      <ol className="module-list">
        <AnimatePresence initial={false}>
          {modules.map((mod, index) => {
            const lessons = contents.filter((c) => c.module_id === mod.id);
            return (
              <GlassView
                as={motion.li}
                key={mod.id}
                className="module-card"
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease, delay: Math.min(index, 8) * 0.06 } }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
              >
                <header className="module-header">
                  <span className="module-index">{t('course.moduleN', { n: index + 1 })}</span>
                  <div className="module-title">
                    <h3>{mod.title}</h3>
                    {mod.description && <p className="muted small">{mod.description}</p>}
                  </div>
                  <RowActions onEdit={() => moduleCrud.open(mod)} onDelete={() => moduleCrud.remove(mod)}>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => contentCrud.open({ module_id: mod.id, position: lessons.length })}
                    >
                      <Icon name="plus" size={14} /> {t('actions.addLesson')}
                    </button>
                  </RowActions>
                </header>
                <ul className="admin-lessons">
                  {lessons.length === 0 && <li className="muted small admin-lesson-empty">{t('course.noLessonsYet')}</li>}
                  <AnimatePresence initial={false}>
                    {lessons.map((lesson, i) => (
                      <motion.li key={lesson.id} layout custom={i} variants={row} initial="initial" animate="animate" exit="exit">
                        {thumbnailUrl(lesson.video_url) ? (
                          <img src={thumbnailUrl(lesson.video_url)} alt="" loading="lazy" className="admin-lesson-thumb" />
                        ) : (
                          <span className="admin-lesson-thumb is-empty" title={t('lesson.noVideo')}>
                            <Icon name="video" size={14} />
                          </span>
                        )}
                        <Link to={`/admin/contents/${lesson.id}`} className="admin-lesson-title">
                          {lesson.title}
                        </Link>
                        <span className="admin-lesson-meta">
                          {lesson.duration_seconds && <span>{clock(lesson.duration_seconds)}</span>}
                          <span title={t('fields.completions')}>
                            <Icon name="checkCircle" size={13} /> {lesson.views_count}
                          </span>
                        </span>
                        <RowActions onEdit={() => contentCrud.open(lesson)} onDelete={() => contentCrud.remove(lesson)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </GlassView>
            );
          })}
        </AnimatePresence>
      </ol>

      <CrudModal crud={courseCrud} config={resources.courses} />
      <CrudModal crud={moduleCrud} config={resources.modules} />
      <CrudModal crud={contentCrud} config={resources.contents} />
    </>
  );
}
