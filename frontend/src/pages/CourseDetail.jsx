import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, listAll } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useCrud } from '../hooks/useCrud';
import { useResources } from '../hooks/useResources';
import { useI18n } from '../i18n';
import CrudModal from '../components/CrudModal';
import RowActions from '../components/RowActions';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

/** Course overview: modules and their contents, editable in place. */
export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, formatDate, apiMessage } = useI18n();
  const resources = useResources();
  const courseId = Number(id);

  const { data, error, reload } = useAsync(async () => {
    const [course, modules, contents] = await Promise.all([
      api.get('courses', courseId),
      listAll('modules', { course_id: courseId }),
      listAll('contents', { course_id: courseId }),
    ]);
    return { course, modules, contents };
  }, [courseId]);

  const courseCrud = useCrud('courses', resources.courses, reload);
  const moduleCrud = useCrud('modules', resources.modules, reload);
  const contentCrud = useCrud('contents', resources.contents, reload);

  if (error) return <div className="alert">{apiMessage(error.message)}</div>;
  if (!data) return <p className="muted">{t('common.loading')}</p>;

  const { course, modules, contents } = data;
  const deleteCourse = async () => {
    if (!window.confirm(t('messages.confirmDeleteCourse', { name: course.title }))) return;
    await api.remove('courses', course.id);
    navigate('/courses');
  };

  return (
    <section>
      <Link to="/courses" className="back-link"><Icon name="chevronLeft" size={16} /> {t('common.backTo', { page: t('nav.courses') })}</Link>
      <PageHeader
        eyebrow={<code>{course.code}</code>}
        title={course.title}
        subtitle={course.description}
        actions={
          <>
            <button type="button" className="btn" onClick={() => courseCrud.open(course)}>
              <Icon name="edit" size={16} /> {t('actions.editCourse')}
            </button>
            <button type="button" className="btn btn-danger" onClick={deleteCourse}>
              <Icon name="trash" size={16} /> {t('actions.delete')}
            </button>
          </>
        }
      />

      <div className="meta-row">
        <span className="cell-user"><Avatar name={course.user_name} size="sm" /> {t('course.createdBy', { name: course.user_name })}</span>
        <span className="muted">· {t('course.updatedAt', { date: formatDate(course.updated_at) })}</span>
      </div>

      <div className="kpis kpis-compact">
        <div className="kpi"><span className="kpi-icon"><Icon name="layers" /></span><div><strong>{course.modules_count}</strong><span>{t('fields.modules')}</span></div></div>
        <div className="kpi"><span className="kpi-icon"><Icon name="file" /></span><div><strong>{course.contents_count}</strong><span>{t('fields.contents')}</span></div></div>
      </div>

      <header className="section-header">
        <h2>{t('course.modulesTitle')}</h2>
        <button type="button" className="btn btn-primary" onClick={() => moduleCrud.open({ course_id: course.id, user_id: course.user_id })}>
          <Icon name="plus" size={16} /> {t('actions.new', { entity: resources.modules.singular })}
        </button>
      </header>

      {modules.length === 0 && <div className="panel empty-panel"><Icon name="inbox" size={28} />{t('course.noModules')}</div>}
      <ol className="module-list">
        {modules.map((mod, index) => {
          const moduleContents = contents.filter((c) => c.module_id === mod.id);
          return (
            <li key={mod.id} className="module-card">
              <header className="module-header">
                <span className="module-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="module-title">
                  <h3>{mod.title}</h3>
                  {mod.description && <p className="muted small">{mod.description}</p>}
                </div>
                <RowActions onEdit={() => moduleCrud.open(mod)} onDelete={() => moduleCrud.remove(mod)}>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => contentCrud.open({ module_id: mod.id })}>
                    <Icon name="plus" size={14} /> {t('actions.addContent')}
                  </button>
                </RowActions>
              </header>
              <ul className="lesson-list">
                {moduleContents.length === 0 && <li className="muted small lesson-empty">{t('course.noContents')}</li>}
                {moduleContents.map((content) => (
                  <li key={content.id}>
                    <Icon name="file" size={16} className="lesson-icon" />
                    <Link to={`/contents/${content.id}`}>{content.title}</Link>
                    <span className="pill" title={t('common.views', { count: content.views_count })}>
                      <Icon name="eye" size={13} /> {content.views_count}
                    </span>
                    <RowActions onEdit={() => contentCrud.open(content)} onDelete={() => contentCrud.remove(content)} />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <CrudModal crud={courseCrud} config={resources.courses} />
      <CrudModal crud={moduleCrud} config={resources.modules} />
      <CrudModal crud={contentCrud} config={resources.contents} />
    </section>
  );
}
