import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, listAll } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { useCrud } from '../hooks/useCrud';
import { resources, formatDate } from '../resources';
import CrudModal from '../components/CrudModal';
import RowActions from '../components/RowActions';

/** Course overview: modules and their contents, editable in place. */
export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (error) return <div className="alert">{error.message}</div>;
  if (!data) return <p className="muted">Loading…</p>;

  const { course, modules, contents } = data;
  const deleteCourse = async () => {
    if (!window.confirm(`Delete course "${course.title}" with all its modules and contents?`)) return;
    await api.remove('courses', course.id);
    navigate('/courses');
  };

  return (
    <section>
      <p className="breadcrumb"><Link to="/courses">Courses</Link> › {course.code}</p>
      <header className="page-header">
        <div>
          <h1>{course.title}</h1>
          <p className="muted">
            <code>{course.code}</code> · created by {course.user_name} · updated {formatDate(course.updated_at)}
          </p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn" onClick={() => courseCrud.open(course)}>Edit course</button>
          <button type="button" className="btn btn-danger" onClick={deleteCourse}>Delete</button>
        </div>
      </header>
      {course.description && <p>{course.description}</p>}

      <div className="stats">
        <div className="stat"><span>{course.modules_count}</span>modules</div>
        <div className="stat"><span>{course.contents_count}</span>contents</div>
      </div>

      <header className="section-header">
        <h2>Modules</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => moduleCrud.open({ course_id: course.id, user_id: course.user_id })}
        >
          + New module
        </button>
      </header>

      {modules.length === 0 && <p className="muted">This course has no modules yet.</p>}
      {modules.map((mod, index) => {
        const moduleContents = contents.filter((c) => c.module_id === mod.id);
        return (
          <article key={mod.id} className="card">
            <header className="card-header">
              <div>
                <h3>{index + 1}. {mod.title}</h3>
                {mod.description && <p className="muted small">{mod.description}</p>}
              </div>
              <RowActions onEdit={() => moduleCrud.open(mod)} onDelete={() => moduleCrud.remove(mod)}>
                <button type="button" className="btn btn-sm" onClick={() => contentCrud.open({ module_id: mod.id })}>
                  + Content
                </button>
              </RowActions>
            </header>
            <ul className="content-list">
              {moduleContents.length === 0 && <li className="muted small">No contents.</li>}
              {moduleContents.map((content) => (
                <li key={content.id}>
                  <Link to={`/contents/${content.id}`}>{content.title}</Link>
                  <span className="muted small">{content.views_count} view(s)</span>
                  <RowActions onEdit={() => contentCrud.open(content)} onDelete={() => contentCrud.remove(content)} />
                </li>
              ))}
            </ul>
          </article>
        );
      })}

      <CrudModal crud={courseCrud} config={resources.courses} />
      <CrudModal crud={moduleCrud} config={resources.modules} />
      <CrudModal crud={contentCrud} config={resources.contents} />
    </section>
  );
}
