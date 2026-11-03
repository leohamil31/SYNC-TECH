const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { db, resetDatabase } = require('./helpers');

const api = request(app);
const PASSWORD = process.env.SEED_PASSWORD || 'SyncTech@2026';

const login = async (email, password = PASSWORD) => {
  const res = await api.post('/api/auth/login').send({ email, password }).expect(200);
  return res.body.token;
};

let admin; // Alice
let student; // Bruno

before(async () => {
  await resetDatabase();
  admin = await login('alice@example.com');
  student = await login('bruno@example.com');
});
after(() => db.destroy());

const as = (token) => ({ Authorization: `Bearer ${token}` });

describe('Auth', () => {
  it('logs in, sets an httpOnly cookie and never exposes the password hash', async () => {
    const res = await api.post('/api/auth/login').send({ email: 'ALICE@example.com', password: PASSWORD }).expect(200);
    assert.equal(res.body.user.role, 'admin');
    assert.equal(res.body.user.password_hash, undefined);
    assert.match(res.headers['set-cookie'][0], /synctech_session=.+HttpOnly/i);
    assert.match(res.headers['set-cookie'][0], /SameSite=Strict/i);
  });

  it('authenticates with the session cookie', async () => {
    const res = await api.post('/api/auth/login').send({ email: 'bruno@example.com', password: PASSWORD });
    const cookie = res.headers['set-cookie'][0].split(';')[0];
    const me = await api.get('/api/auth/me').set('Cookie', cookie).expect(200);
    assert.equal(me.body.email, 'bruno@example.com');
  });

  it('rejects wrong passwords and inactive accounts with the same message', async () => {
    const wrong = await api.post('/api/auth/login').send({ email: 'alice@example.com', password: 'nope1234' }).expect(401);
    const inactive = await api.post('/api/auth/login').send({ email: 'eva@example.com', password: PASSWORD }).expect(401);
    const unknown = await api.post('/api/auth/login').send({ email: 'ghost@example.com', password: PASSWORD }).expect(401);
    assert.equal(wrong.body.error.message, inactive.body.error.message);
    assert.equal(wrong.body.error.message, unknown.body.error.message);
  });

  it('rejects tampered tokens', async () => {
    const [header, , signature] = student.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 1, role: 'admin', exp: 9999999999 })).toString('base64url');
    await api.get('/api/auth/me').set(as(`${header}.${forged}.${signature}`)).expect(401);
  });

  it('registers students only, even if a role is sent', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'New Learner', email: 'new@example.com', password: 'learn1234', role: 'admin' })
      .expect(201);
    assert.equal(res.body.user.role, 'student');
    await api.post('/api/auth/register').send({ name: 'Weak', email: 'weak@example.com', password: 'short' }).expect(400);
  });
});

describe('Access control', () => {
  it('requires a session for the API', async () => {
    await api.get('/api/me/courses').expect(401);
    await api.get('/api/users').expect(401);
  });

  it('forbids admin routes to students', async () => {
    await api.get('/api/users').set(as(student)).expect(403);
    await api.post('/api/courses').set(as(student)).send({ code: 'X-1', title: 'Nope', user_id: 2 }).expect(403);
    await api.get('/api/reports/courses-summary').set(as(student)).expect(403);
  });

  it('prevents an admin from locking themselves out', async () => {
    await api.patch('/api/users/1').set(as(admin)).send({ role: 'student' }).expect(409);
    await api.delete('/api/users/1').set(as(admin)).expect(409);
  });
});

describe('Admin CRUD', () => {
  it('lists users with pagination meta and without password hashes', async () => {
    const res = await api.get('/api/users?limit=2').set(as(admin)).expect(200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.meta.limit, 2);
    assert.ok(res.body.data.every((u) => !('password_hash' in u)));
  });

  it('creates a user that can sign in, then updates and deletes it', async () => {
    const created = await api
      .post('/api/users')
      .set(as(admin))
      .send({ name: 'Test User', email: ' TEST@Example.com ', password: 'secret123' })
      .expect(201);
    assert.equal(created.body.email, 'test@example.com');
    assert.equal(created.body.role, 'student');
    await login('test@example.com', 'secret123');

    const patched = await api.patch(`/api/users/${created.body.id}`).set(as(admin)).send({ status: 'inactive' }).expect(200);
    assert.equal(patched.body.status, 'inactive');
    await api.post('/api/auth/login').send({ email: 'test@example.com', password: 'secret123' }).expect(401);

    await api.delete(`/api/users/${created.body.id}`).set(as(admin)).expect(204);
    await api.get(`/api/users/${created.body.id}`).set(as(admin)).expect(404);
  });

  it('rejects invalid payloads and duplicated emails', async () => {
    const invalid = await api.post('/api/users').set(as(admin)).send({ name: 'A', email: 'nope' }).expect(400);
    assert.deepEqual(invalid.body.error.details.map((d) => d.field).sort(), ['email', 'name', 'password']);
    await api.post('/api/users').set(as(admin)).send({ name: 'Alice', email: 'alice@example.com', password: 'abc12345' }).expect(409);
  });

  it('does not delete a user that authored courses', async () => {
    await api.delete('/api/users/2').set(as(admin)).expect(409);
  });

  it('returns computed counters for a course', async () => {
    const res = await api.get('/api/courses/1').set(as(admin)).expect(200);
    assert.equal(res.body.modules_count, 2);
    assert.equal(res.body.contents_count, 4);
    assert.equal(res.body.user_name, 'Alice Johnson');
  });

  it('normalizes YouTube URLs and rejects other hosts', async () => {
    const ok = await api
      .post('/api/contents')
      .set(as(admin))
      .send({ module_id: 1, title: 'Extra', content: 'Body', video_url: 'https://youtu.be/ENrzD9HAZK4?t=10' })
      .expect(201);
    assert.equal(ok.body.video_url, 'https://www.youtube.com/watch?v=ENrzD9HAZK4');
    await api.delete(`/api/contents/${ok.body.id}`).set(as(admin)).expect(204);

    const bad = await api
      .post('/api/contents')
      .set(as(admin))
      .send({ module_id: 1, title: 'Extra', content: 'Body', video_url: 'https://example.com/video' })
      .expect(400);
    assert.equal(bad.body.error.details[0].field, 'video_url');
  });

  it('cascades course deletion to modules and contents', async () => {
    const course = await api.post('/api/courses').set(as(admin)).send({ code: 'tmp-1', title: 'Temporary', user_id: 2 }).expect(201);
    assert.equal(course.body.code, 'TMP-1');
    const mod = await api.post('/api/modules').set(as(admin)).send({ course_id: course.body.id, user_id: 2, title: 'Temp module' }).expect(201);
    const content = await api
      .post('/api/contents')
      .set(as(admin))
      .send({ module_id: mod.body.id, title: 'Temp lesson', content: 'Body' })
      .expect(201);

    await api.delete(`/api/courses/${course.body.id}`).set(as(admin)).expect(204);
    await api.get(`/api/modules/${mod.body.id}`).set(as(admin)).expect(404);
    await api.get(`/api/contents/${content.body.id}`).set(as(admin)).expect(404);
  });
});

describe('Learner area', () => {
  it('lists published courses with the learner progress', async () => {
    const res = await api.get('/api/me/courses').set(as(student)).expect(200);
    assert.equal(res.body.length, 5);
    const node = res.body.find((c) => c.code === 'NODE-101');
    assert.equal(node.lessons_count, 4);
    assert.equal(node.completed_lessons, 1);
    assert.match(node.cover_video_url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
  });

  it('hides unpublished courses from students but not from admins', async () => {
    await api.patch('/api/courses/5').set(as(admin)).send({ published: false }).expect(200);
    const list = await api.get('/api/me/courses').set(as(student)).expect(200);
    assert.ok(!list.body.some((c) => c.id === 5));
    await api.get('/api/me/courses/5').set(as(student)).expect(404);
    await api.get('/api/me/lessons/15').set(as(student)).expect(404);
    await api.get('/api/me/courses/5').set(as(admin)).expect(200);
    await api.patch('/api/courses/5').set(as(admin)).send({ published: true }).expect(200);
  });

  it('returns the course outline and the lesson to continue', async () => {
    const res = await api.get('/api/me/courses/2').set(as(student)).expect(200);
    assert.equal(res.body.modules.length, 2);
    assert.equal(res.body.completed_lessons, 1);
    assert.equal(res.body.next_lesson_id, 6);
  });

  it('serves a lesson with neighbours and resume position', async () => {
    const res = await api.get('/api/me/lessons/6').set(as(student)).expect(200);
    assert.equal(res.body.position_seconds, 400);
    assert.equal(res.body.previous_lesson_id, 5);
    assert.equal(res.body.next_lesson_id, 7);
    assert.equal(res.body.index, 2);
    assert.equal(res.body.total, 3);
  });

  it('saves progress, completes and resets a lesson', async () => {
    let res = await api.put('/api/me/lessons/7/progress').set(as(student)).send({ position_seconds: 42 }).expect(200);
    assert.equal(res.body.position_seconds, 42);
    assert.equal(res.body.completed_at, null);

    res = await api.put('/api/me/lessons/7/progress').set(as(student)).send({ completed: true }).expect(200);
    assert.ok(res.body.completed_at);
    assert.equal(res.body.position_seconds, 42);

    const summary = await api.get('/api/me/summary').set(as(student)).expect(200);
    assert.equal(summary.body.completed_lessons, 3);
    assert.equal(summary.body.resume.id, 6);

    await api.delete('/api/me/lessons/7/progress').set(as(student)).expect(204);
    res = await api.get('/api/me/lessons/7').set(as(student)).expect(200);
    assert.equal(res.body.completed_at, null);
  });

  it('validates progress payloads', async () => {
    await api.put('/api/me/lessons/7/progress').set(as(student)).send({}).expect(400);
    await api.put('/api/me/lessons/7/progress').set(as(student)).send({ position_seconds: -5 }).expect(400);
    await api.put('/api/me/lessons/9999/progress').set(as(student)).send({ completed: true }).expect(404);
  });
});

describe('Content viewers (admin)', () => {
  it('marks and unmarks a content as completed for a user', async () => {
    await api.post('/api/contents/2/views').set(as(admin)).send({ user_id: 2 }).expect(201);
    // Idempotent: marking again does not duplicate the record.
    await api.post('/api/contents/2/views').set(as(admin)).send({ user_id: 2 }).expect(201);
    let viewers = await api.get('/api/contents/2/views').set(as(admin)).expect(200);
    assert.deepEqual(viewers.body.map((v) => v.id).sort(), [1, 2, 3, 4]);

    await api.delete('/api/contents/2/views/2').set(as(admin)).expect(204);
    viewers = await api.get('/api/contents/2/views').set(as(admin)).expect(200);
    assert.deepEqual(viewers.body.map((v) => v.id).sort(), [1, 3, 4]);
  });

  it('returns 404 for an unknown content', async () => {
    await api.get('/api/contents/9999/views').set(as(admin)).expect(404);
  });
});

describe('Reports', () => {
  it('SQL 01 - users with most courses', async () => {
    const res = await api.get('/api/reports/users-most-courses').set(as(admin)).expect(200);
    assert.equal(res.body[0].name, 'Alice Johnson');
    assert.equal(res.body[0].total_courses, 3);
  });

  it('SQL 02 - course with most contents includes ties', async () => {
    const res = await api.get('/api/reports/course-most-contents').set(as(admin)).expect(200);
    assert.deepEqual(res.body.map((c) => [c.code, c.total_contents]), [
      ['NODE-101', 4],
      ['SQL-101', 4],
      ['GIT-101', 4],
    ]);
  });

  it('SQL 03 - courses summary', async () => {
    const res = await api.get('/api/reports/courses-summary').set(as(admin)).expect(200);
    assert.deepEqual(
      res.body.map((c) => [c.total_modules, c.total_contents]),
      [[2, 4], [2, 3], [2, 4], [2, 3], [2, 4]],
    );
  });

  it('SQL 04 - contents with course name', async () => {
    const res = await api.get('/api/reports/contents-with-course').set(as(admin)).expect(200);
    assert.equal(res.body.length, 18);
    assert.equal(res.body[0].course_title, 'Node.js: do runtime à API');
  });

  it('SQL 05 - users who completed content 2', async () => {
    const res = await api.get('/api/reports/content-viewers/2').set(as(admin)).expect(200);
    assert.deepEqual(res.body.map((u) => u.name).sort(), ['Alice Johnson', 'Carla Souza', 'Daniel Costa']);
  });

  it('SQL 06 - completion per course', async () => {
    const res = await api.get('/api/reports/course-completion').set(as(admin)).expect(200);
    assert.equal(res.body.length, 5);
    assert.ok(res.body.every((r) => typeof r.completions === 'number'));
  });
});

describe('Errors and docs', () => {
  it('returns JSON 404 for unknown API routes', async () => {
    const res = await api.get('/api/unknown').expect(404);
    assert.equal(res.body.error.status, 404);
  });

  it('serves the OpenAPI document', async () => {
    const res = await api.get('/api/docs.json').expect(200);
    assert.equal(res.body.openapi, '3.0.3');
    assert.ok(res.body.paths['/auth/login']);
  });
});
