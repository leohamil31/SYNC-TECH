/**
 * In-browser implementation of the REST API, used by the GitHub Pages demo
 * (VITE_DEMO=true) where no Node.js/PostgreSQL backend is available.
 * It mirrors the real API: same routes, payloads, validation rules,
 * constraints (unique, foreign keys, cascades) and report results.
 * Data is persisted in localStorage.
 */
const STORAGE_KEY = 'course-manager-demo';
const TABLES = ['users', 'courses', 'modules', 'contents', 'content_views'];

const now = () => new Date().toISOString();

class MockError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Same data as backend/src/db/seeds/01_initial_data.js */
function seed() {
  const db = { seq: {}, ...Object.fromEntries(TABLES.map((t) => [t, []])) };
  const insert = (table, row) => {
    db.seq[table] = (db.seq[table] || 0) + 1;
    const record = { id: db.seq[table], ...row, created_at: now(), updated_at: now() };
    db[table].push(record);
    return record;
  };

  [
    ['Alice Johnson', 'alice@example.com', 'active'],
    ['Bruno Silva', 'bruno@example.com', 'active'],
    ['Carla Souza', 'carla@example.com', 'active'],
    ['Daniel Costa', 'daniel@example.com', 'active'],
    ['Eva Martins', 'eva@example.com', 'inactive'],
  ].forEach(([name, email, status]) => insert('users', { name, email, status }));

  [
    ['NODE-101', 'Node.js Fundamentals', 'Build back-end applications with Node.js.', 1, 5, 3],
    ['REACT-101', 'React from Scratch', 'Components, hooks and state management.', 2, 3, 5],
    ['SQL-101', 'PostgreSQL Essentials', 'Relational modeling and SQL queries.', 1, 2, 4],
    ['DOCKER-101', 'Docker for Developers', 'Containers, images and Compose.', 1, 1, 2],
    ['GIT-101', 'Git and GitHub', 'Version control in practice.', 3, 1, 1],
  ].forEach(([code, title, description, userId, modules, contentsPerModule]) => {
    const course = insert('courses', { code, title, description, user_id: userId });
    for (let m = 1; m <= modules; m += 1) {
      const mod = insert('modules', {
        course_id: course.id,
        user_id: userId,
        title: `${title} - Module ${m}`,
        description: `Module ${m} of ${code}.`,
      });
      for (let i = 1; i <= contentsPerModule; i += 1) {
        insert('contents', {
          module_id: mod.id,
          title: `Lesson ${m}.${i}`,
          content: `Content of lesson ${m}.${i} from ${code}.`,
        });
      }
    }
  });

  [[1, 1], [1, 2], [3, 2], [4, 2], [2, 16], [5, 31]].forEach(([userId, contentId]) =>
    insert('content_views', { user_id: userId, content_id: contentId, watched_at: now() }),
  );
  return db;
}

function load() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Storage unavailable or corrupted: start from the seed data.
  }
  return seed();
}

let db = load();
const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Keep working in memory only.
  }
};

export function resetDemoData() {
  db = seed();
  persist();
}

/* ---------- helpers ---------- */

const find = (table, id) => db[table].find((r) => r.id === Number(id));
const mustFind = (table, label, id) => {
  const record = find(table, id);
  if (!record) throw new MockError(404, `${label} ${id} not found`);
  return record;
};
const countWhere = (table, predicate) => db[table].filter(predicate).length;
const moduleIdsOf = (courseId) => db.modules.filter((m) => m.course_id === courseId).map((m) => m.id);
const byKeys = (...keys) => (a, b) => {
  for (const key of keys) {
    const diff = typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key];
    if (diff) return diff;
  }
  return 0;
};

/* ---------- validation (mirrors backend/src/validators/schemas.js) ---------- */

const rules = {
  text: (min, max) => (v) => {
    if (typeof v !== 'string' || v.trim().length < min) return `Too small: expected string to have >=${min} characters`;
    if (v.trim().length > max) return `Too big: expected string to have <=${max} characters`;
    return null;
  },
  optionalText: (v) => (v == null || typeof v === 'string' ? null : 'Invalid input: expected string'),
  email: (v) => (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Invalid email address'),
  status: (v) => (['active', 'inactive'].includes(v) ? null : 'Invalid option: expected one of "active"|"inactive"'),
  id: (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? null : 'Invalid input: expected positive integer'),
};

const definitions = {
  users: {
    label: 'User',
    fields: { name: rules.text(2, 120), email: rules.email, status: rules.status },
    defaults: { status: 'active' },
    normalize: (d) => ({ ...d, ...(d.email && { email: d.email.trim().toLowerCase() }) }),
    unique: [['email', 'users_email_unique']],
    refs: {},
    search: ['name', 'email'],
    filters: { status: (r, v) => r.status === v },
    order: byKeys('id'),
    decorate: (u) => ({ ...u, courses_count: countWhere('courses', (c) => c.user_id === u.id) }),
  },
  courses: {
    label: 'Course',
    fields: { code: rules.text(2, 30), title: rules.text(2, 150), description: rules.optionalText, user_id: rules.id },
    normalize: (d) => ({ ...d, ...(d.code && { code: d.code.trim().toUpperCase() }) }),
    unique: [['code', 'courses_code_unique']],
    refs: { user_id: ['users', 'courses_user_id_foreign'] },
    search: ['code', 'title'],
    filters: { user_id: (r, v) => r.user_id === Number(v) },
    order: byKeys('id'),
    decorate: (c) => {
      const moduleIds = moduleIdsOf(c.id);
      return {
        ...c,
        user_name: find('users', c.user_id)?.name,
        modules_count: moduleIds.length,
        contents_count: countWhere('contents', (ct) => moduleIds.includes(ct.module_id)),
      };
    },
  },
  modules: {
    label: 'Module',
    fields: { course_id: rules.id, user_id: rules.id, title: rules.text(2, 150), description: rules.optionalText },
    refs: { course_id: ['courses', 'modules_course_id_foreign'], user_id: ['users', 'modules_user_id_foreign'] },
    unique: [],
    search: ['title'],
    filters: {
      course_id: (r, v) => r.course_id === Number(v),
      user_id: (r, v) => r.user_id === Number(v),
    },
    order: byKeys('course_id', 'id'),
    decorate: (m) => ({
      ...m,
      course_title: find('courses', m.course_id)?.title,
      user_name: find('users', m.user_id)?.name,
      contents_count: countWhere('contents', (ct) => ct.module_id === m.id),
    }),
  },
  contents: {
    label: 'Content',
    fields: { module_id: rules.id, title: rules.text(2, 150), content: rules.text(1, 20000) },
    refs: { module_id: ['modules', 'contents_module_id_foreign'] },
    unique: [],
    search: ['title', 'content'],
    filters: {
      module_id: (r, v) => r.module_id === Number(v),
      course_id: (r, v) => r.course_id === Number(v),
    },
    order: byKeys('course_id', 'module_id', 'id'),
    decorate: (ct) => {
      const mod = find('modules', ct.module_id);
      const course = mod && find('courses', mod.course_id);
      return {
        ...ct,
        module_title: mod?.title,
        course_id: course?.id,
        course_title: course?.title,
        views_count: countWhere('content_views', (v) => v.content_id === ct.id),
      };
    },
  },
};

function validate(def, body, partial) {
  const data = { ...(partial ? {} : def.defaults), ...body };
  const details = [];
  Object.entries(def.fields).forEach(([field, check]) => {
    if (partial && !(field in body)) return;
    const message = check(data[field]);
    if (message) details.push({ field, message });
  });
  if (partial && !Object.keys(body).some((k) => k in def.fields)) {
    details.push({ field: '', message: 'At least one field is required' });
  }
  if (details.length) throw new MockError(400, 'Validation failed', details);

  const clean = Object.fromEntries(Object.keys(def.fields).filter((f) => f in data).map((f) => [f, data[f]]));
  Object.keys(def.refs).forEach((f) => f in clean && (clean[f] = Number(clean[f])));
  ['title', 'name', 'content', 'description'].forEach((f) => typeof clean[f] === 'string' && (clean[f] = clean[f].trim()));
  return def.normalize ? def.normalize(clean) : clean;
}

function checkConstraints(table, def, data, id) {
  def.unique.forEach(([field, constraint]) => {
    if (field in data && db[table].some((r) => r[field] === data[field] && r.id !== id)) {
      throw new MockError(409, 'A record with the same unique value already exists', {
        constraint,
        detail: `Key (${field})=(${data[field]}) already exists.`,
      });
    }
  });
  Object.entries(def.refs).forEach(([field, [refTable, constraint]]) => {
    if (field in data && !find(refTable, data[field])) {
      throw new MockError(409, 'A referenced record does not exist', {
        constraint,
        detail: `Key (${field})=(${data[field]}) is not present in table "${refTable}".`,
      });
    }
  });
}

/* ---------- CRUD ---------- */

function list(table, query) {
  const def = definitions[table];
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const search = query.search?.trim().toLowerCase();

  let rows = db[table].map(def.decorate);
  Object.entries(def.filters).forEach(([param, predicate]) => {
    if (query[param]) rows = rows.filter((r) => predicate(r, query[param]));
  });
  if (search) rows = rows.filter((r) => def.search.some((f) => String(r[f] ?? '').toLowerCase().includes(search)));
  rows.sort(def.order);

  return {
    data: rows.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total: rows.length, total_pages: Math.ceil(rows.length / limit) },
  };
}

function create(table, body) {
  const def = definitions[table];
  const data = validate(def, body, false);
  checkConstraints(table, def, data);
  db.seq[table] = (db.seq[table] || 0) + 1;
  const record = { id: db.seq[table], ...data, created_at: now(), updated_at: now() };
  db[table].push(record);
  return def.decorate(record);
}

function update(table, id, body, partial) {
  const def = definitions[table];
  const record = mustFind(table, def.label, id);
  const data = validate(def, body, partial);
  checkConstraints(table, def, data, record.id);
  Object.assign(record, data, { updated_at: now() });
  return def.decorate(record);
}

function remove(table, id) {
  const def = definitions[table];
  const record = mustFind(table, def.label, id);

  if (table === 'users') {
    const referenced = db.courses.some((c) => c.user_id === record.id) ? 'courses'
      : db.modules.some((m) => m.user_id === record.id) ? 'modules' : null;
    if (referenced) {
      throw new MockError(409, 'This record is referenced by other records and cannot be removed', {
        constraint: `${referenced}_user_id_foreign`,
        detail: `Key (id)=(${record.id}) is still referenced from table "${referenced}".`,
      });
    }
    db.content_views = db.content_views.filter((v) => v.user_id !== record.id);
  }

  // ON DELETE CASCADE: course -> modules -> contents -> content_views
  const courseIds = table === 'courses' ? [record.id] : [];
  const moduleIds = table === 'modules' ? [record.id] : db.modules.filter((m) => courseIds.includes(m.course_id)).map((m) => m.id);
  const contentIds = table === 'contents' ? [record.id] : db.contents.filter((c) => moduleIds.includes(c.module_id)).map((c) => c.id);

  db.content_views = db.content_views.filter((v) => !contentIds.includes(v.content_id));
  db.contents = db.contents.filter((c) => !contentIds.includes(c.id));
  db.modules = db.modules.filter((m) => !moduleIds.includes(m.id));
  db.courses = db.courses.filter((c) => !courseIds.includes(c.id));
  if (table === 'users') db.users = db.users.filter((u) => u.id !== record.id);
}

/* ---------- content views & reports ---------- */

const viewers = (contentId) =>
  db.content_views
    .filter((v) => v.content_id === Number(contentId))
    .map((v) => {
      const u = find('users', v.user_id);
      return { id: u.id, name: u.name, email: u.email, watched_at: v.watched_at };
    })
    .sort((a, b) => a.watched_at.localeCompare(b.watched_at) || a.name.localeCompare(b.name));

function courseTotals() {
  return [...db.courses].sort(byKeys('id')).map((c) => {
    const moduleIds = moduleIdsOf(c.id);
    return {
      id: c.id,
      code: c.code,
      title: c.title,
      total_modules: moduleIds.length,
      total_contents: countWhere('contents', (ct) => moduleIds.includes(ct.module_id)),
    };
  });
}

const reports = {
  'users-most-courses': () =>
    db.users
      .map((u) => ({ id: u.id, name: u.name, email: u.email, total_courses: countWhere('courses', (c) => c.user_id === u.id) }))
      .sort((a, b) => b.total_courses - a.total_courses || a.name.localeCompare(b.name)),
  'course-most-contents': () => {
    const totals = courseTotals();
    const max = Math.max(...totals.map((c) => c.total_contents));
    return totals
      .filter((c) => c.total_contents === max)
      .map(({ id, code, title, total_contents }) => ({ id, code, title, total_contents }));
  },
  'courses-summary': courseTotals,
  'contents-with-course': () =>
    [...db.contents]
      .map(definitions.contents.decorate)
      .sort(byKeys('course_id', 'module_id', 'id'))
      .map((ct) => ({
        id: ct.id,
        content_title: ct.title,
        module_id: ct.module_id,
        module_title: ct.module_title,
        course_id: ct.course_id,
        course_title: ct.course_title,
      })),
};

/* ---------- router ---------- */

function route(method, path, body) {
  const [pathname, search = ''] = path.split('?');
  const query = Object.fromEntries(new URLSearchParams(search));
  const parts = pathname.split('/').filter(Boolean);
  const [resource, id, sub, subId] = parts;

  if (resource === 'health') return { status: 200, body: { status: 'ok' } };

  if (resource === 'reports' && method === 'GET') {
    if (id === 'content-viewers' && sub) return { status: 200, body: viewers(sub) };
    if (reports[id]) return { status: 200, body: reports[id]() };
  }

  if (resource === 'contents' && sub === 'views') {
    mustFind('contents', 'Content', id);
    if (method === 'GET' && !subId) return { status: 200, body: viewers(id) };
    if (method === 'POST' && !subId) {
      if (rules.id(body?.user_id)) throw new MockError(400, 'Validation failed', [{ field: 'user_id', message: rules.id(body?.user_id) }]);
      const userId = Number(body.user_id);
      if (!find('users', userId)) {
        throw new MockError(409, 'A referenced record does not exist', { constraint: 'content_views_user_id_foreign' });
      }
      let view = db.content_views.find((v) => v.user_id === userId && v.content_id === Number(id));
      if (view) view.updated_at = now();
      else {
        db.seq.content_views = (db.seq.content_views || 0) + 1;
        view = { id: db.seq.content_views, user_id: userId, content_id: Number(id), watched_at: now(), created_at: now(), updated_at: now() };
        db.content_views.push(view);
      }
      return { status: 201, body: { id: view.id, user_id: view.user_id, content_id: view.content_id, watched_at: view.watched_at } };
    }
    if (method === 'DELETE' && subId) {
      const before = db.content_views.length;
      db.content_views = db.content_views.filter((v) => !(v.user_id === Number(subId) && v.content_id === Number(id)));
      if (before === db.content_views.length) throw new MockError(404, `User ${subId} has not watched content ${id}`);
      return { status: 204, body: null };
    }
  }

  if (definitions[resource] && !sub) {
    if (id !== undefined && rules.id(id)) {
      throw new MockError(400, 'Validation failed', [{ field: 'id', message: 'Invalid input: expected number, received NaN' }]);
    }
    const def = definitions[resource];
    if (!id && method === 'GET') return { status: 200, body: list(resource, query) };
    if (!id && method === 'POST') return { status: 201, body: create(resource, body || {}) };
    if (id && method === 'GET') return { status: 200, body: def.decorate(mustFind(resource, def.label, id)) };
    if (id && method === 'PUT') return { status: 200, body: update(resource, id, body || {}, false) };
    if (id && method === 'PATCH') return { status: 200, body: update(resource, id, body || {}, true) };
    if (id && method === 'DELETE') {
      remove(resource, id);
      return { status: 204, body: null };
    }
  }

  throw new MockError(404, `Route ${method} /api${pathname} not found`);
}

/** Same contract as the HTTP client: resolves with the JSON body or throws ApiError-like errors. */
export async function mockRequest(method, path, body, ErrorClass) {
  await new Promise((resolve) => setTimeout(resolve, 80)); // simulate network latency
  // Snapshot so a failing request never leaves partial changes behind (like a transaction).
  const snapshot = JSON.stringify(db);
  try {
    const result = route(method, path, body && JSON.parse(JSON.stringify(body)));
    if (method !== 'GET') persist();
    return result.body && JSON.parse(JSON.stringify(result.body));
  } catch (error) {
    db = JSON.parse(snapshot);
    if (error instanceof MockError) throw new ErrorClass(error.status, error.message, error.details);
    throw error;
  }
}
