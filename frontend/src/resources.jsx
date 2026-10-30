import { Link } from 'react-router-dom';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');
const truncate = (text, size = 60) => (text && text.length > size ? `${text.slice(0, size)}…` : text || '—');

const userOptions = { resource: 'users', label: (u) => `${u.name} (${u.email})` };

/**
 * Declarative configuration for each CRUD screen: table columns,
 * form fields and list filters. ResourcePage renders all of them.
 */
export const resources = {
  users: {
    title: 'Users',
    singular: 'user',
    columns: [
      { key: 'id', label: 'ID', numeric: true },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status', render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
      { key: 'courses_count', label: 'Courses', numeric: true },
      { key: 'updated_at', label: 'Updated', render: (r) => formatDate(r.updated_at) },
    ],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        defaultValue: 'active',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ],
    filters: [
      { name: 'status', label: 'Status', placeholder: 'Any status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
    ],
  },

  courses: {
    title: 'Courses',
    singular: 'course',
    columns: [
      { key: 'id', label: 'ID', numeric: true },
      { key: 'code', label: 'Code', render: (r) => <code>{r.code}</code> },
      { key: 'title', label: 'Title', render: (r) => <Link to={`/courses/${r.id}`}>{r.title}</Link> },
      { key: 'user_name', label: 'Created by' },
      { key: 'modules_count', label: 'Modules', numeric: true },
      { key: 'contents_count', label: 'Contents', numeric: true },
      { key: 'updated_at', label: 'Updated', render: (r) => formatDate(r.updated_at) },
    ],
    fields: [
      { name: 'code', label: 'Unique code', required: true },
      { name: 'title', label: 'Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'user_id', label: 'Created by', type: 'select', required: true, optionsFrom: userOptions },
    ],
    filters: [{ name: 'user_id', label: 'Author', optionsFrom: { resource: 'users', label: (u) => u.name } }],
  },

  modules: {
    title: 'Modules',
    singular: 'module',
    columns: [
      { key: 'id', label: 'ID', numeric: true },
      { key: 'title', label: 'Title' },
      { key: 'course_title', label: 'Course', render: (r) => <Link to={`/courses/${r.course_id}`}>{r.course_title}</Link> },
      { key: 'user_name', label: 'Created by' },
      { key: 'contents_count', label: 'Contents', numeric: true },
      { key: 'description', label: 'Description', render: (r) => truncate(r.description, 40) },
    ],
    fields: [
      { name: 'course_id', label: 'Course', type: 'select', required: true, optionsFrom: { resource: 'courses', label: (c) => `${c.code} — ${c.title}` } },
      { name: 'title', label: 'Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'user_id', label: 'Created by', type: 'select', required: true, optionsFrom: userOptions },
    ],
    filters: [{ name: 'course_id', label: 'Course', optionsFrom: { resource: 'courses', label: (c) => c.title } }],
  },

  contents: {
    title: 'Contents',
    singular: 'content',
    columns: [
      { key: 'id', label: 'ID', numeric: true },
      { key: 'title', label: 'Title', render: (r) => <Link to={`/contents/${r.id}`}>{r.title}</Link> },
      { key: 'module_title', label: 'Module' },
      { key: 'course_title', label: 'Course', render: (r) => <Link to={`/courses/${r.course_id}`}>{r.course_title}</Link> },
      { key: 'views_count', label: 'Views', numeric: true },
      { key: 'content', label: 'Content', render: (r) => truncate(r.content, 40) },
    ],
    fields: [
      { name: 'module_id', label: 'Module', type: 'select', required: true, optionsFrom: { resource: 'modules', label: (m) => `${m.course_title} › ${m.title}` } },
      { name: 'title', label: 'Title', required: true },
      { name: 'content', label: 'Content', type: 'textarea', rows: 8, required: true },
    ],
    filters: [
      { name: 'course_id', label: 'Course', optionsFrom: { resource: 'courses', label: (c) => c.title } },
    ],
  },
};

export { formatDate };
