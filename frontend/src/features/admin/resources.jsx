import { Link } from 'react-router-dom';
import Avatar from '../../design-system/Avatar';
import Icon from '../../design-system/Icon';
import { clock } from '../../shared/lib/format';
import { thumbnailUrl } from '../../shared/lib/youtube';

const truncate = (text, size = 60) => (text && text.length > size ? `${text.slice(0, size)}…` : text || '—');

/**
 * Declarative configuration of each admin CRUD screen: table columns, form fields and list filters.
 * Field types understood by ResourceForm: text, email, password, textarea, select, checkbox, number, duration, youtube.
 * Built per language because labels are translated.
 */
export function getResources(t, formatDate) {
  const statusOptions = [
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ];
  const roleOptions = [
    { value: 'student', label: t('roles.student') },
    { value: 'admin', label: t('roles.admin') },
  ];
  const publishedOptions = [
    { value: 'true', label: t('status.published') },
    { value: 'false', label: t('status.draft') },
  ];
  const userOptions = { resource: 'users', label: (u) => `${u.name} (${u.email})` };
  const courseLink = (id, title) => <Link to={`/admin/courses/${id}`}>{title}</Link>;
  const updated = { key: 'updated_at', label: t('fields.updated'), render: (r) => <span className="muted">{formatDate(r.updated_at, 'short')}</span> };

  return {
    users: {
      title: t('entities.users'),
      singular: t('entities.user'),
      description: t('descriptions.users'),
      columns: [
        { key: 'name', label: t('fields.name'), render: (r) => (
          <span className="cell-user"><Avatar name={r.name} /><span><strong>{r.name}</strong><small>{r.email}</small></span></span>
        ) },
        { key: 'role', label: t('fields.role'), render: (r) => <span className={`badge${r.role === 'admin' ? ' badge-admin' : ''}`}>{t(`roles.${r.role}`)}</span> },
        { key: 'status', label: t('fields.status'), render: (r) => <span className={`badge badge-${r.status}`}>{t(`status.${r.status}`)}</span> },
        { key: 'completed_lessons', label: t('fields.completedLessons'), numeric: true },
        { key: 'last_login_at', label: t('fields.lastLogin'), render: (r) => <span className="muted">{r.last_login_at ? formatDate(r.last_login_at) : t('common.never')}</span> },
      ],
      fields: [
        { name: 'name', label: t('fields.name'), required: true, autoComplete: 'off' },
        { name: 'email', label: t('fields.email'), type: 'email', required: true, autoComplete: 'off' },
        { name: 'password', label: t('fields.password'), type: 'password', requiredOnCreate: true, hint: t('hints.password'), hintOnEdit: t('hints.passwordKeep') },
        { name: 'role', label: t('fields.role'), type: 'select', required: true, defaultValue: 'student', options: roleOptions },
        { name: 'status', label: t('fields.status'), type: 'select', required: true, defaultValue: 'active', options: statusOptions },
      ],
      filters: [
        { name: 'role', label: t('fields.role'), placeholder: t('common.anyRole'), options: roleOptions },
        { name: 'status', label: t('fields.status'), placeholder: t('common.anyStatus'), options: statusOptions },
      ],
      deleteLabel: (r) => r.name,
    },

    courses: {
      title: t('entities.courses'),
      singular: t('entities.course'),
      description: t('descriptions.courses'),
      columns: [
        { key: 'title', label: t('fields.course'), render: (r) => (
          <span className="cell-stack"><Link to={`/admin/courses/${r.id}`} className="strong-link">{r.title}</Link><code>{r.code}</code></span>
        ) },
        { key: 'published', label: t('fields.visibility'), render: (r) => (
          <span className={`badge ${r.published ? 'badge-active' : 'badge-draft'}`}>{r.published ? t('status.published') : t('status.draft')}</span>
        ) },
        { key: 'user_name', label: t('fields.createdBy'), render: (r) => <span className="cell-user"><Avatar name={r.user_name} size="sm" />{r.user_name}</span> },
        { key: 'modules_count', label: t('fields.modules'), numeric: true },
        { key: 'contents_count', label: t('fields.lessons'), numeric: true },
        updated,
      ],
      fields: [
        { name: 'code', label: t('fields.uniqueCode'), required: true, hint: t('hints.code') },
        { name: 'title', label: t('fields.title'), required: true },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
        { name: 'user_id', label: t('fields.createdBy'), type: 'select', required: true, optionsFrom: userOptions },
        { name: 'published', label: t('fields.publishedLabel'), type: 'checkbox', defaultValue: true, hint: t('hints.published') },
      ],
      filters: [
        { name: 'user_id', label: t('fields.author'), placeholder: t('common.allAuthors'), optionsFrom: { resource: 'users', label: (u) => u.name } },
        { name: 'published', label: t('fields.visibility'), placeholder: t('common.anyVisibility'), options: publishedOptions },
      ],
      deleteLabel: (r) => r.title,
    },

    modules: {
      title: t('entities.modules'),
      singular: t('entities.module'),
      description: t('descriptions.modules'),
      columns: [
        { key: 'title', label: t('fields.title'), render: (r) => (
          <span className="cell-stack"><strong>{r.title}</strong><small className="muted">{truncate(r.description, 50)}</small></span>
        ) },
        { key: 'course_title', label: t('fields.course'), render: (r) => courseLink(r.course_id, r.course_title) },
        { key: 'user_name', label: t('fields.createdBy') },
        { key: 'contents_count', label: t('fields.lessons'), numeric: true },
      ],
      fields: [
        { name: 'course_id', label: t('fields.course'), type: 'select', required: true, optionsFrom: { resource: 'courses', label: (c) => `${c.code}: ${c.title}` } },
        { name: 'title', label: t('fields.title'), required: true },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
        { name: 'user_id', label: t('fields.createdBy'), type: 'select', required: true, optionsFrom: userOptions },
      ],
      filters: [{ name: 'course_id', label: t('fields.course'), placeholder: t('common.allCourses'), optionsFrom: { resource: 'courses', label: (c) => c.title } }],
      deleteLabel: (r) => r.title,
    },

    contents: {
      title: t('entities.contents'),
      singular: t('entities.content'),
      description: t('descriptions.contents'),
      columns: [
        { key: 'title', label: t('fields.lesson'), render: (r) => (
          <span className="cell-lesson">
            {thumbnailUrl(r.video_url) ? <img src={thumbnailUrl(r.video_url)} alt="" loading="lazy" /> : <span className="cell-lesson-empty"><Icon name="video" size={14} /></span>}
            <span className="cell-stack"><Link to={`/admin/contents/${r.id}`} className="strong-link">{r.title}</Link><small className="muted">{r.module_title}</small></span>
          </span>
        ) },
        { key: 'course_title', label: t('fields.course'), render: (r) => courseLink(r.course_id, r.course_title) },
        { key: 'duration_seconds', label: t('fields.duration'), numeric: true, render: (r) => (r.duration_seconds ? clock(r.duration_seconds) : '—') },
        { key: 'views_count', label: t('fields.completions'), numeric: true },
      ],
      fields: [
        { name: 'module_id', label: t('fields.module'), type: 'select', required: true, optionsFrom: { resource: 'modules', label: (m) => `${m.course_title} / ${m.title}` } },
        { name: 'title', label: t('fields.title'), required: true },
        { name: 'video_url', label: t('fields.videoUrl'), type: 'youtube', hint: t('hints.videoUrl') },
        { name: 'duration_seconds', label: t('fields.duration'), type: 'duration', hint: t('hints.duration') },
        { name: 'position', label: t('fields.position'), type: 'number', defaultValue: 0, min: 0, hint: t('hints.position') },
        { name: 'content', label: t('fields.summary'), type: 'textarea', rows: 5, required: true },
      ],
      filters: [{ name: 'course_id', label: t('fields.course'), placeholder: t('common.allCourses'), optionsFrom: { resource: 'courses', label: (c) => c.title } }],
      deleteLabel: (r) => r.title,
    },
  };
}
