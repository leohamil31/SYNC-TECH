const db = require('../db/connection');
const createCrudService = require('./crud.service');
const { hashPassword } = require('../utils/password');

const count = (table, foreignKey, parent) =>
  db(table).count('*').where(foreignKey, db.ref(parent));

/** Columns safe to expose. password_hash never leaves the database layer. */
const USER_COLUMNS = ['id', 'name', 'email', 'status', 'role', 'last_login_at', 'created_at', 'updated_at'];

const userService = createCrudService({
  table: 'users',
  alias: 'u',
  label: 'User',
  readQuery: (a) =>
    db(`users as ${a}`).select(
      ...USER_COLUMNS.map((column) => `${a}.${column}`),
      db.raw('(?)::int as courses_count', [count('courses', 'courses.user_id', `${a}.id`)]),
      db.raw('(?)::int as completed_lessons', [
        db('content_views')
          .count('*')
          .where('content_views.user_id', db.ref(`${a}.id`))
          .whereNotNull('content_views.completed_at'),
      ]),
    ),
  searchColumns: ['u.name', 'u.email'],
  filters: { status: 'u.status', role: 'u.role' },
  prepare: async ({ password, ...rest }) => (password ? { ...rest, password_hash: await hashPassword(password) } : rest),
});

const courseService = createCrudService({
  table: 'courses',
  alias: 'c',
  label: 'Course',
  readQuery: (a) =>
    db(`courses as ${a}`)
      .join('users as u', 'u.id', `${a}.user_id`)
      .select(
        `${a}.*`,
        'u.name as user_name',
        db.raw('(?)::int as modules_count', [count('modules', 'modules.course_id', `${a}.id`)]),
        db.raw('(?)::int as contents_count', [
          db('contents')
            .count('*')
            .join('modules', 'modules.id', 'contents.module_id')
            .where('modules.course_id', db.ref(`${a}.id`)),
        ]),
      ),
  searchColumns: ['c.code', 'c.title'],
  filters: { user_id: 'c.user_id', published: 'c.published' },
});

const moduleService = createCrudService({
  table: 'modules',
  alias: 'm',
  label: 'Module',
  readQuery: (a) =>
    db(`modules as ${a}`)
      .join('courses as c', 'c.id', `${a}.course_id`)
      .join('users as u', 'u.id', `${a}.user_id`)
      .select(
        `${a}.*`,
        'c.title as course_title',
        'u.name as user_name',
        db.raw('(?)::int as contents_count', [count('contents', 'contents.module_id', `${a}.id`)]),
      ),
  searchColumns: ['m.title'],
  filters: { course_id: 'm.course_id', user_id: 'm.user_id' },
  orderBy: [['m.course_id', 'asc'], ['m.id', 'asc']],
});

const contentService = createCrudService({
  table: 'contents',
  alias: 'ct',
  label: 'Content',
  readQuery: (a) =>
    db(`contents as ${a}`)
      .join('modules as m', 'm.id', `${a}.module_id`)
      .join('courses as c', 'c.id', 'm.course_id')
      .select(
        `${a}.*`,
        'm.title as module_title',
        'c.id as course_id',
        'c.title as course_title',
        // "Views" = learners who completed the lesson.
        db.raw('(?)::int as views_count', [
          count('content_views', 'content_views.content_id', `${a}.id`).whereNotNull('content_views.completed_at'),
        ]),
      ),
  searchColumns: ['ct.title', 'ct.content'],
  filters: { module_id: 'ct.module_id', course_id: 'c.id' },
  orderBy: [['c.id', 'asc'], ['m.id', 'asc'], ['ct.position', 'asc'], ['ct.id', 'asc']],
});

module.exports = { userService, courseService, moduleService, contentService, USER_COLUMNS };
