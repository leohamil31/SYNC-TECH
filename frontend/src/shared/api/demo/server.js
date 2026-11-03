/**
 * In-browser implementation of the SyncTech API for the GitHub Pages demo (VITE_DEMO=true).
 * GitHub Pages only serves static files, so routes, validation, roles, progress and reports
 * are reproduced here over a localStorage database seeded with the same data as the backend.
 *
 * This is a demo, not security: everything runs in the visitor's own browser.
 * The normal build never includes this file (it is loaded with a dynamic import).
 */
import { CATALOG } from './catalog';

const STORAGE_KEY = 'synctech-demo-db-v2';
const SESSION_KEY = 'synctech-demo-session';
export const DEMO_PASSWORD = 'SyncTech@2026';

const now = () => new Date().toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();

class DemoError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
const fail = (status, message, details) => {
  throw new DemoError(status, message, details);
};

/* ---------------------------------------------------------------- seed */

function seed() {
  const db = { seq: {}, users: [], courses: [], modules: [], contents: [], content_views: [] };
  const insert = (table, row) => {
    db.seq[table] = (db.seq[table] || 0) + 1;
    const record = { id: db.seq[table], created_at: now(), updated_at: now(), ...row };
    db[table].push(record);
    return record;
  };

  const people = [
    ['alice', 'Alice Johnson', 'alice@example.com', 'active', 'admin', hoursAgo(2)],
    ['bruno', 'Bruno Silva', 'bruno@example.com', 'active', 'student', hoursAgo(5)],
    ['carla', 'Carla Souza', 'carla@example.com', 'active', 'student', hoursAgo(26)],
    ['daniel', 'Daniel Costa', 'daniel@example.com', 'active', 'student', hoursAgo(72)],
    ['eva', 'Eva Martins', 'eva@example.com', 'inactive', 'student', null],
  ];
  const ids = {};
  people.forEach(([key, name, email, status, role, last]) => {
    ids[key] = insert('users', { name, email, status, role, password: DEMO_PASSWORD, last_login_at: last }).id;
  });

  CATALOG.forEach((course) => {
    const c = insert('courses', { code: course.code, title: course.title, description: course.description, user_id: ids[course.author], published: true });
    course.modules.forEach((mod) => {
      const m = insert('modules', { course_id: c.id, user_id: ids[course.author], title: mod.title, description: mod.description });
      mod.lessons.forEach(([title, videoId, duration, content], position) => {
        insert('contents', { module_id: m.id, title, content, video_url: `https://www.youtube.com/watch?v=${videoId}`, duration_seconds: duration, position });
      });
    });
  });

  // Same progress as the backend seed (lesson ids 1-4 Node, 5-7 React, 8-11 SQL, 12-14 Docker, 15-18 Git).
  const done = (u, contentId, h) => insert('content_views', { user_id: ids[u], content_id: contentId, position_seconds: 0, watched_at: hoursAgo(h + 1), completed_at: hoursAgo(h), updated_at: hoursAgo(h) });
  const started = (u, contentId, pos, h) => insert('content_views', { user_id: ids[u], content_id: contentId, position_seconds: pos, watched_at: hoursAgo(h), completed_at: null, updated_at: hoursAgo(h) });
  done('alice', 1, 30); done('alice', 2, 28); done('bruno', 1, 50); done('bruno', 5, 8); started('bruno', 6, 400, 5);
  done('carla', 2, 40); done('carla', 15, 27); started('carla', 16, 60, 26); done('daniel', 2, 72); done('eva', 12, 200);
  return db;
}

let db;
try {
  db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed();
} catch {
  db = seed();
}
const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
};

export function resetDemoData() {
  db = seed();
  persist();
}

/* ---------------------------------------------------------------- session */

const session = {
  get: () => {
    try {
      return Number(localStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  },
  set: (id) => {
    try {
      if (id) localStorage.setItem(SESSION_KEY, String(id));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  },
};

const PUBLIC_USER = ['id', 'name', 'email', 'status', 'role', 'last_login_at', 'created_at', 'updated_at'];
const pick = (row, keys) => Object.fromEntries(keys.map((k) => [k, row[k]]));
const find = (table, id) => db[table].find((r) => r.id === Number(id));

function currentUser() {
  const user = find('users', session.get());
  if (!user || user.status !== 'active') fail(401, 'Authentication required');
  return user;
}
const requireAdmin = () => {
  const user = currentUser();
  if (user.role !== 'admin') fail(403, 'You do not have permission to perform this action');
  return user;
};

/* ---------------------------------------------------------------- helpers */

const ytId = (value) => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  try {
    const u = new URL(v);
    if (!/(^|\.)youtube(-nocookie)?\.com$|^youtu\.be$/.test(u.hostname)) return null;
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

const lessonsOfCourse = (courseId) =>
  db.modules
    .filter((m) => m.course_id === courseId)
    .sort((a, b) => a.id - b.id)
    .flatMap((m) => db.contents.filter((c) => c.module_id === m.id).sort((a, b) => a.position - b.position || a.id - b.id));

const courseOfContent = (content) => find('courses', find('modules', content.module_id)?.course_id);
const viewOf = (userId, contentId) => db.content_views.find((v) => v.user_id === userId && v.content_id === contentId);
const completedViews = (contentId) => db.content_views.filter((v) => v.content_id === contentId && v.completed_at);

/* ---------------------------------------------------------------- validation (mirrors validators/schemas.js) */

const checks = {
  text: (min, max) => (v) => (typeof v !== 'string' || v.trim().length < min ? `Too small: expected string to have >=${min} characters` : v.trim().length > max ? `Too big: expected string to have <=${max} characters` : null),
  email: (v) => (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Invalid email address'),
  password: (v) => (typeof v !== 'string' || v.length < 8 ? 'Too small: expected string to have >=8 characters' : !/[A-Za-z]/.test(v) ? 'Password must contain a letter' : !/\d/.test(v) ? 'Password must contain a number' : null),
  oneOf: (...values) => (v) => (values.includes(v) ? null : `Invalid option: expected one of ${values.join('|')}`),
  id: (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? null : 'Invalid input: expected positive integer'),
  optional: (check) => (v) => (v === null || v === undefined || v === '' ? null : check(v)),
  youtube: (v) => (v === null || v === undefined || v === '' || ytId(v) ? null : 'Invalid YouTube URL'),
  bool: (v) => (typeof v === 'boolean' ? null : 'Invalid input: expected boolean'),
};

const RESOURCES = {
  users: {
    label: 'User',
    fields: {
      name: checks.text(2, 120),
      email: checks.email,
      status: checks.optional(checks.oneOf('active', 'inactive')),
      role: checks.optional(checks.oneOf('student', 'admin')),
      password: checks.password,
    },
    defaults: { status: 'active', role: 'student' },
    optionalOnUpdate: ['password'],
    normalize: (d) => ({ ...d, ...(d.email && { email: d.email.trim().toLowerCase() }) }),
    unique: ['email'],
    refs: {},
    search: ['name', 'email'],
    filters: ['status', 'role'],
    order: (a, b) => a.id - b.id,
    view: (u) => ({
      ...pick(u, PUBLIC_USER),
      courses_count: db.courses.filter((c) => c.user_id === u.id).length,
      completed_lessons: db.content_views.filter((v) => v.user_id === u.id && v.completed_at).length,
    }),
  },
  courses: {
    label: 'Course',
    fields: { code: checks.text(2, 30), title: checks.text(2, 150), description: () => null, user_id: checks.id, published: checks.optional(checks.bool) },
    defaults: { published: true },
    normalize: (d) => ({ ...d, ...(d.code && { code: d.code.trim().toUpperCase() }) }),
    unique: ['code'],
    refs: { user_id: 'users' },
    search: ['code', 'title'],
    filters: ['user_id', 'published'],
    order: (a, b) => a.id - b.id,
    view: (c) => {
      const lessons = lessonsOfCourse(c.id);
      return { ...c, user_name: find('users', c.user_id)?.name, modules_count: db.modules.filter((m) => m.course_id === c.id).length, contents_count: lessons.length };
    },
  },
  modules: {
    label: 'Module',
    fields: { course_id: checks.id, user_id: checks.id, title: checks.text(2, 150), description: () => null },
    defaults: {},
    unique: [],
    refs: { course_id: 'courses', user_id: 'users' },
    search: ['title'],
    filters: ['course_id', 'user_id'],
    order: (a, b) => a.course_id - b.course_id || a.id - b.id,
    view: (m) => ({ ...m, course_title: find('courses', m.course_id)?.title, user_name: find('users', m.user_id)?.name, contents_count: db.contents.filter((c) => c.module_id === m.id).length }),
  },
  contents: {
    label: 'Content',
    fields: {
      module_id: checks.id,
      title: checks.text(2, 150),
      content: checks.text(1, 20000),
      video_url: checks.youtube,
      duration_seconds: checks.optional(checks.id),
      position: checks.optional((v) => (Number.isInteger(Number(v)) && Number(v) >= 0 ? null : 'Invalid input: expected number')),
    },
    defaults: { position: 0 },
    normalize: (d) => ({
      ...d,
      ...('video_url' in d && { video_url: d.video_url ? `https://www.youtube.com/watch?v=${ytId(d.video_url)}` : null }),
      ...('duration_seconds' in d && { duration_seconds: d.duration_seconds ? Number(d.duration_seconds) : null }),
      ...('position' in d && { position: Number(d.position) || 0 }),
    }),
    unique: [],
    refs: { module_id: 'modules' },
    search: ['title', 'content'],
    filters: ['module_id', 'course_id'],
    order: (a, b) => a.course_id - b.course_id || a.module_id - b.module_id || a.position - b.position || a.id - b.id,
    view: (ct) => {
      const mod = find('modules', ct.module_id);
      const course = mod && find('courses', mod.course_id);
      return { ...ct, module_title: mod?.title, course_id: course?.id, course_title: course?.title, views_count: completedViews(ct.id).length };
    },
  },
};

function validate(def, body, { partial, update }) {
  const data = { ...(partial ? {} : def.defaults), ...body };
  const details = [];
  Object.entries(def.fields).forEach(([field, check]) => {
    if (partial && !(field in body)) return;
    if (update && def.optionalOnUpdate?.includes(field) && (data[field] === undefined || data[field] === '')) return;
    const message = check(data[field]);
    if (message) details.push({ field, message });
  });
  if (partial && !Object.keys(body).some((k) => k in def.fields)) details.push({ field: '', message: 'At least one field is required' });
  if (details.length) fail(400, 'Validation failed', details);

  const clean = Object.fromEntries(Object.keys(def.fields).filter((f) => f in data && data[f] !== undefined).map((f) => [f, data[f]]));
  if (update && !clean.password) delete clean.password;
  Object.keys(def.refs).forEach((f) => f in clean && (clean[f] = Number(clean[f])));
  ['title', 'name', 'content', 'description'].forEach((f) => typeof clean[f] === 'string' && (clean[f] = clean[f].trim()));
  return def.normalize ? def.normalize(clean) : clean;
}

function constraints(table, def, data, id) {
  def.unique.forEach((field) => {
    if (field in data && db[table].some((r) => r[field] === data[field] && r.id !== id)) {
      fail(409, 'A record with the same unique value already exists', { constraint: `${table}_${field}_unique` });
    }
  });
  Object.entries(def.refs).forEach(([field, refTable]) => {
    if (field in data && !find(refTable, data[field])) fail(409, 'A referenced record does not exist', { constraint: `${table}_${field}_foreign` });
  });
}

/* ---------------------------------------------------------------- admin CRUD */

function list(table, query) {
  const def = RESOURCES[table];
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const search = query.search?.trim().toLowerCase();
  let rows = db[table].map(def.view);
  def.filters.forEach((f) => {
    if (query[f] === undefined || query[f] === '') return;
    rows = rows.filter((r) => String(r[f]) === String(query[f]));
  });
  if (search) rows = rows.filter((r) => def.search.some((f) => String(r[f] ?? '').toLowerCase().includes(search)));
  rows.sort(def.order);
  return { data: rows.slice((page - 1) * limit, page * limit), meta: { page, limit, total: rows.length, total_pages: Math.ceil(rows.length / limit) } };
}

function removeRecord(table, record, admin) {
  if (table === 'users') {
    if (record.id === admin.id) fail(409, 'You cannot delete your own account');
    if (db.courses.some((c) => c.user_id === record.id) || db.modules.some((m) => m.user_id === record.id)) {
      fail(409, 'This record is referenced by other records and cannot be removed');
    }
    db.content_views = db.content_views.filter((v) => v.user_id !== record.id);
    db.users = db.users.filter((u) => u.id !== record.id);
    return;
  }
  // ON DELETE CASCADE: course -> modules -> contents -> content_views
  const courseIds = table === 'courses' ? [record.id] : [];
  const moduleIds = table === 'modules' ? [record.id] : db.modules.filter((m) => courseIds.includes(m.course_id)).map((m) => m.id);
  const contentIds = table === 'contents' ? [record.id] : db.contents.filter((c) => moduleIds.includes(c.module_id)).map((c) => c.id);
  db.content_views = db.content_views.filter((v) => !contentIds.includes(v.content_id));
  db.contents = db.contents.filter((c) => !contentIds.includes(c.id));
  db.modules = db.modules.filter((m) => !moduleIds.includes(m.id));
  db.courses = db.courses.filter((c) => !courseIds.includes(c.id));
}

function crud(method, table, id, body, query) {
  const admin = requireAdmin();
  const def = RESOURCES[table];
  if (!id) {
    if (method === 'GET') return [200, list(table, query)];
    if (method === 'POST') {
      const data = validate(def, body, { partial: false, update: false });
      constraints(table, def, data);
      db.seq[table] = (db.seq[table] || 0) + 1;
      const record = { id: db.seq[table], created_at: now(), updated_at: now(), ...data };
      if (table === 'users') record.last_login_at = null;
      db[table].push(record);
      return [201, def.view(record)];
    }
  }
  const record = find(table, id);
  if (!record) fail(404, `${def.label} ${id} not found`);
  if (method === 'GET') return [200, def.view(record)];
  if (method === 'PUT' || method === 'PATCH') {
    const data = validate(def, body, { partial: method === 'PATCH', update: true });
    if (table === 'users' && record.id === admin.id && (data.role === 'student' || data.status === 'inactive')) {
      fail(409, 'You cannot remove your own admin access');
    }
    constraints(table, def, data, record.id);
    Object.assign(record, data, { updated_at: now() });
    return [200, def.view(record)];
  }
  if (method === 'DELETE') {
    removeRecord(table, record, admin);
    return [204, null];
  }
  return null;
}

/* ---------------------------------------------------------------- learner */

const visibleCourse = (user, courseId) => {
  const course = find('courses', courseId);
  if (!course || (!course.published && user.role !== 'admin')) fail(404, `Course ${courseId} not found`);
  return course;
};

function courseSummary(user, course) {
  const lessons = lessonsOfCourse(course.id);
  const views = lessons.map((l) => viewOf(user.id, l.id)).filter(Boolean);
  return {
    id: course.id,
    code: course.code,
    title: course.title,
    description: course.description,
    published: course.published,
    author_name: find('users', course.user_id)?.name,
    modules_count: db.modules.filter((m) => m.course_id === course.id).length,
    lessons_count: lessons.length,
    total_seconds: lessons.reduce((s, l) => s + (l.duration_seconds || 0), 0),
    completed_lessons: views.filter((v) => v.completed_at).length,
    started_lessons: views.length,
    last_activity_at: views.map((v) => v.updated_at).sort().pop() || null,
    cover_video_url: lessons.find((l) => l.video_url)?.video_url || null,
  };
}

const lessonWithProgress = (user, l) => {
  const v = viewOf(user.id, l.id);
  return { id: l.id, title: l.title, module_id: l.module_id, video_url: l.video_url, duration_seconds: l.duration_seconds, position: l.position, position_seconds: v?.position_seconds || 0, completed_at: v?.completed_at || null, last_activity_at: v?.updated_at || null };
};

function learner(method, parts, body, query) {
  const user = currentUser();
  const [, section, id, sub] = parts;

  if (section === 'courses' && !id && method === 'GET') {
    const search = query.search?.trim().toLowerCase();
    return [200, db.courses
      .filter((c) => c.published || user.role === 'admin')
      .filter((c) => !search || [c.title, c.code, c.description].some((f) => String(f || '').toLowerCase().includes(search)))
      .sort((a, b) => a.id - b.id)
      .map((c) => courseSummary(user, c))];
  }

  if (section === 'courses' && id && method === 'GET') {
    const course = visibleCourse(user, id);
    const lessons = lessonsOfCourse(course.id).map((l) => lessonWithProgress(user, l));
    const next = lessons.find((l) => !l.completed_at) || lessons[0];
    return [200, {
      ...courseSummary(user, course),
      updated_at: course.updated_at,
      next_lesson_id: next?.id ?? null,
      modules: db.modules.filter((m) => m.course_id === course.id).sort((a, b) => a.id - b.id).map((m) => ({ id: m.id, title: m.title, description: m.description, lessons: lessons.filter((l) => l.module_id === m.id) })),
    }];
  }

  if (section === 'lessons' && id) {
    const content = find('contents', id);
    const course = content && courseOfContent(content);
    if (!content || !course || (!course.published && user.role !== 'admin')) fail(404, `Content ${id} not found`);

    if (sub === 'progress' && method === 'PUT') {
      const pos = body?.position_seconds;
      if (pos === undefined && body?.completed === undefined) fail(400, 'Validation failed', [{ field: '', message: 'Send position_seconds and/or completed' }]);
      if (pos !== undefined && !(Number.isInteger(Number(pos)) && Number(pos) >= 0)) fail(400, 'Validation failed', [{ field: 'position_seconds', message: 'Invalid input: expected number' }]);
      let view = viewOf(user.id, content.id);
      if (!view) {
        db.seq.content_views = (db.seq.content_views || 0) + 1;
        view = { id: db.seq.content_views, user_id: user.id, content_id: content.id, position_seconds: 0, watched_at: now(), completed_at: null, created_at: now() };
        db.content_views.push(view);
      }
      if (pos !== undefined) view.position_seconds = Number(pos);
      if (body.completed === true) view.completed_at ||= now();
      if (body.completed === false) view.completed_at = null;
      view.updated_at = now();
      return [200, pick(view, ['content_id', 'position_seconds', 'watched_at', 'completed_at', 'updated_at'])];
    }
    if (sub === 'progress' && method === 'DELETE') {
      db.content_views = db.content_views.filter((v) => !(v.user_id === user.id && v.content_id === content.id));
      return [204, null];
    }
    if (!sub && method === 'GET') {
      const lessons = lessonsOfCourse(course.id);
      const index = lessons.findIndex((l) => l.id === content.id);
      const p = lessonWithProgress(user, content);
      return [200, {
        id: content.id,
        title: content.title,
        content: content.content,
        video_url: content.video_url,
        duration_seconds: content.duration_seconds,
        module_id: content.module_id,
        module_title: find('modules', content.module_id)?.title,
        course: { id: course.id, code: course.code, title: course.title },
        position_seconds: p.position_seconds,
        completed_at: p.completed_at,
        index: index + 1,
        total: lessons.length,
        previous_lesson_id: lessons[index - 1]?.id ?? null,
        next_lesson_id: lessons[index + 1]?.id ?? null,
      }];
    }
  }

  if (section === 'summary' && method === 'GET') {
    const mine = db.content_views.filter((v) => v.user_id === user.id);
    const resumeView = mine
      .filter((v) => !v.completed_at)
      .filter((v) => {
        const c = find('contents', v.content_id);
        const course = c && courseOfContent(c);
        return course && (course.published || user.role === 'admin');
      })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    const courses = db.courses.filter((c) => c.published || user.role === 'admin').map((c) => courseSummary(user, c)).filter((c) => c.started_lessons > 0);
    let resume = null;
    if (resumeView) {
      const c = find('contents', resumeView.content_id);
      const course = courseOfContent(c);
      resume = { id: c.id, title: c.title, video_url: c.video_url, duration_seconds: c.duration_seconds, position_seconds: resumeView.position_seconds, updated_at: resumeView.updated_at, course_id: course.id, course_title: course.title };
    }
    return [200, {
      completed_lessons: mine.filter((v) => v.completed_at).length,
      watched_seconds: mine.reduce((s, v) => s + (v.completed_at ? find('contents', v.content_id)?.duration_seconds || v.position_seconds : v.position_seconds), 0),
      courses_in_progress: courses.filter((c) => c.completed_lessons < c.lessons_count).length,
      courses_completed: courses.filter((c) => c.lessons_count && c.completed_lessons === c.lessons_count).length,
      resume,
    }];
  }
  return null;
}

/* ---------------------------------------------------------------- reports & viewers */

const viewers = (contentId) =>
  completedViews(Number(contentId))
    .map((v) => ({ ...pick(find('users', v.user_id), ['id', 'name', 'email']), watched_at: v.watched_at, completed_at: v.completed_at }))
    .sort((a, b) => a.completed_at.localeCompare(b.completed_at) || a.name.localeCompare(b.name));

const reports = {
  'users-most-courses': () => db.users.map((u) => ({ id: u.id, name: u.name, email: u.email, total_courses: db.courses.filter((c) => c.user_id === u.id).length })).sort((a, b) => b.total_courses - a.total_courses || a.name.localeCompare(b.name)),
  'courses-summary': () => [...db.courses].sort((a, b) => a.id - b.id).map((c) => ({ id: c.id, code: c.code, title: c.title, total_modules: db.modules.filter((m) => m.course_id === c.id).length, total_contents: lessonsOfCourse(c.id).length })),
  'course-most-contents': () => {
    const totals = reports['courses-summary']();
    const max = Math.max(0, ...totals.map((c) => c.total_contents));
    return totals.filter((c) => c.total_contents === max).map(({ id, code, title, total_contents }) => ({ id, code, title, total_contents }));
  },
  'contents-with-course': () => [...db.courses].sort((a, b) => a.id - b.id).flatMap((c) => lessonsOfCourse(c.id).map((l) => ({ id: l.id, content_title: l.title, module_id: l.module_id, module_title: find('modules', l.module_id)?.title, course_id: c.id, course_title: c.title }))),
  'course-completion': () => db.courses.map((c) => {
    const ids = lessonsOfCourse(c.id).map((l) => l.id);
    const views = db.content_views.filter((v) => ids.includes(v.content_id));
    return { id: c.id, code: c.code, title: c.title, total_contents: ids.length, learners: new Set(views.map((v) => v.user_id)).size, completions: views.filter((v) => v.completed_at).length };
  }).sort((a, b) => b.completions - a.completions || a.id - b.id),
};

/* ---------------------------------------------------------------- router */

function route(method, path, body) {
  const [pathname, search = ''] = path.split('?');
  const query = Object.fromEntries(new URLSearchParams(search));
  const parts = pathname.split('/').filter(Boolean);
  const [root, id, sub, subId] = parts;

  if (root === 'health') return [200, { status: 'ok' }];

  if (root === 'auth') {
    if (id === 'login' && method === 'POST') {
      const email = String(body?.email || '').trim().toLowerCase();
      const user = db.users.find((u) => u.email === email);
      if (!user || user.password !== body?.password || user.status !== 'active') fail(401, 'Invalid e-mail or password');
      user.last_login_at = now();
      session.set(user.id);
      return [200, { user: pick(user, PUBLIC_USER), token: 'demo', expires_in: 28800 }];
    }
    if (id === 'register' && method === 'POST') {
      const data = validate(RESOURCES.users, { name: body?.name, email: body?.email, password: body?.password }, { partial: false, update: false });
      constraints('users', RESOURCES.users, data);
      db.seq.users += 1;
      const user = { id: db.seq.users, ...data, role: 'student', status: 'active', last_login_at: now(), created_at: now(), updated_at: now() };
      db.users.push(user);
      session.set(user.id);
      return [201, { user: pick(user, PUBLIC_USER), token: 'demo', expires_in: 28800 }];
    }
    if (id === 'logout' && method === 'POST') {
      session.set(null);
      return [204, null];
    }
    if (id === 'me' && method === 'GET') return [200, pick(currentUser(), PUBLIC_USER)];
  }

  if (root === 'me') {
    const result = learner(method, parts, body, query);
    if (result) return result;
  }

  if (root === 'reports' && method === 'GET') {
    requireAdmin();
    if (id === 'content-viewers' && sub) return [200, viewers(sub)];
    if (reports[id]) return [200, reports[id]()];
  }

  if (root === 'contents' && sub === 'views') {
    requireAdmin();
    const content = find('contents', id);
    if (!content) fail(404, `Content ${id} not found`);
    if (method === 'GET' && !subId) return [200, viewers(id)];
    if (method === 'POST' && !subId) {
      const userId = Number(body?.user_id);
      if (!find('users', userId)) fail(409, 'A referenced record does not exist');
      let view = viewOf(userId, content.id);
      if (!view) {
        db.seq.content_views = (db.seq.content_views || 0) + 1;
        view = { id: db.seq.content_views, user_id: userId, content_id: content.id, position_seconds: 0, watched_at: now(), created_at: now() };
        db.content_views.push(view);
      }
      view.completed_at ||= now();
      view.updated_at = now();
      return [201, pick(view, ['id', 'user_id', 'content_id', 'watched_at', 'completed_at'])];
    }
    if (method === 'DELETE' && subId) {
      const view = viewOf(Number(subId), content.id);
      if (!view?.completed_at) fail(404, `User ${subId} has not watched content ${id}`);
      view.completed_at = null;
      view.updated_at = now();
      return [204, null];
    }
  }

  if (RESOURCES[root] && !sub) {
    const result = crud(method, root, id, body || {}, query);
    if (result) return result;
  }

  return fail(404, `Route ${method} /api${pathname} not found`);
}

/** Same contract as the HTTP client: resolves with the JSON body or throws an ApiError. */
export async function demoRequest(method, path, body, ErrorClass) {
  await new Promise((resolve) => setTimeout(resolve, 120)); // feels like a network
  const snapshot = JSON.stringify(db);
  try {
    const [, payload] = route(method, path, body === undefined ? undefined : JSON.parse(JSON.stringify(body)));
    if (method !== 'GET' || path.startsWith('/auth')) persist();
    return payload === null ? null : JSON.parse(JSON.stringify(payload));
  } catch (error) {
    db = JSON.parse(snapshot); // a failed request never leaves partial changes behind
    if (error instanceof DemoError) throw new ErrorClass(error.status, error.message, error.details);
    throw error;
  }
}
