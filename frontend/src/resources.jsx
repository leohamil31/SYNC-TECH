import { Link } from 'react-router-dom';
import Avatar from './components/Avatar';

const truncate = (text, size = 60) => (text && text.length > size ? `${text.slice(0, size)}…` : text || '—');

/**
 * Declarative configuration for each CRUD screen: table columns, form fields
 * and list filters. Labels are translated, so it is built per language.
 */
export function getResources(t, formatDate) {
  const statusOptions = [
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ];
  const userOptions = { resource: 'users', label: (u) => `${u.name} (${u.email})` };
  const courseLink = (id, title) => <Link to={`/courses/${id}`}>{title}</Link>;

  return {
    users: {
      title: t('entities.users'),
      singular: t('entities.user'),
      description: t('descriptions.users'),
      icon: 'users',
      columns: [
        { key: 'name', label: t('fields.name'), render: (r) => (
          <span className="cell-user"><Avatar name={r.name} /><span><strong>{r.name}</strong><small>{r.email}</small></span></span>
        ) },
        { key: 'status', label: t('fields.status'), render: (r) => <span className={`badge badge-${r.status}`}>{t(`status.${r.status}`)}</span> },
        { key: 'courses_count', label: t('fields.courses'), numeric: true },
        { key: 'updated_at', label: t('fields.updated'), render: (r) => <span className="muted">{formatDate(r.updated_at)}</span> },
      ],
      fields: [
        { name: 'name', label: t('fields.name'), required: true },
        { name: 'email', label: t('fields.email'), type: 'email', required: true },
        { name: 'status', label: t('fields.status'), type: 'select', required: true, defaultValue: 'active', options: statusOptions },
      ],
      filters: [{ name: 'status', label: t('fields.status'), placeholder: t('common.anyStatus'), options: statusOptions }],
    },

    courses: {
      title: t('entities.courses'),
      singular: t('entities.course'),
      description: t('descriptions.courses'),
      icon: 'book',
      columns: [
        { key: 'title', label: t('fields.course'), render: (r) => (
          <span className="cell-stack"><Link to={`/courses/${r.id}`} className="strong-link">{r.title}</Link><code>{r.code}</code></span>
        ) },
        { key: 'user_name', label: t('fields.createdBy'), render: (r) => <span className="cell-user"><Avatar name={r.user_name} size="sm" />{r.user_name}</span> },
        { key: 'modules_count', label: t('fields.modules'), numeric: true },
        { key: 'contents_count', label: t('fields.contents'), numeric: true },
        { key: 'updated_at', label: t('fields.updated'), render: (r) => <span className="muted">{formatDate(r.updated_at)}</span> },
      ],
      fields: [
        { name: 'code', label: t('fields.uniqueCode'), required: true },
        { name: 'title', label: t('fields.title'), required: true },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
        { name: 'user_id', label: t('fields.createdBy'), type: 'select', required: true, optionsFrom: userOptions },
      ],
      filters: [{ name: 'user_id', label: t('fields.author'), placeholder: t('common.allAuthors'), optionsFrom: { resource: 'users', label: (u) => u.name } }],
    },

    modules: {
      title: t('entities.modules'),
      singular: t('entities.module'),
      description: t('descriptions.modules'),
      icon: 'layers',
      columns: [
        { key: 'title', label: t('fields.title'), render: (r) => (
          <span className="cell-stack"><strong>{r.title}</strong><small className="muted">{truncate(r.description, 50)}</small></span>
        ) },
        { key: 'course_title', label: t('fields.course'), render: (r) => courseLink(r.course_id, r.course_title) },
        { key: 'user_name', label: t('fields.createdBy') },
        { key: 'contents_count', label: t('fields.contents'), numeric: true },
      ],
      fields: [
        { name: 'course_id', label: t('fields.course'), type: 'select', required: true, optionsFrom: { resource: 'courses', label: (c) => `${c.code} — ${c.title}` } },
        { name: 'title', label: t('fields.title'), required: true },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
        { name: 'user_id', label: t('fields.createdBy'), type: 'select', required: true, optionsFrom: userOptions },
      ],
      filters: [{ name: 'course_id', label: t('fields.course'), placeholder: t('common.allCourses'), optionsFrom: { resource: 'courses', label: (c) => c.title } }],
    },

    contents: {
      title: t('entities.contents'),
      singular: t('entities.content'),
      description: t('descriptions.contents'),
      icon: 'file',
      columns: [
        { key: 'title', label: t('fields.title'), render: (r) => (
          <span className="cell-stack"><Link to={`/contents/${r.id}`} className="strong-link">{r.title}</Link><small className="muted">{truncate(r.content, 50)}</small></span>
        ) },
        { key: 'module_title', label: t('fields.module') },
        { key: 'course_title', label: t('fields.course'), render: (r) => courseLink(r.course_id, r.course_title) },
        { key: 'views_count', label: t('fields.views'), render: (r) => <span className="pill"><span className="pill-icon">◉</span>{r.views_count}</span> },
      ],
      fields: [
        { name: 'module_id', label: t('fields.module'), type: 'select', required: true, optionsFrom: { resource: 'modules', label: (m) => `${m.course_title} › ${m.title}` } },
        { name: 'title', label: t('fields.title'), required: true },
        { name: 'content', label: t('fields.content'), type: 'textarea', rows: 8, required: true },
      ],
      filters: [{ name: 'course_id', label: t('fields.course'), placeholder: t('common.allCourses'), optionsFrom: { resource: 'courses', label: (c) => c.title } }],
    },
  };
}
