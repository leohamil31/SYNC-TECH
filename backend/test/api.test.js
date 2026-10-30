const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { db, resetDatabase } = require('./helpers');

const api = request(app);

before(resetDatabase);
after(() => db.destroy());

describe('Users', () => {
  it('lists users with pagination meta', async () => {
    const res = await api.get('/api/users?limit=2').expect(200);
    assert.equal(res.body.data.length, 2);
    assert.deepEqual(res.body.meta, { page: 1, limit: 2, total: 5, total_pages: 3 });
  });

  it('creates, updates and deletes a user', async () => {
    const created = await api
      .post('/api/users')
      .send({ name: 'Test User', email: ' TEST@Example.com ' })
      .expect(201);
    assert.equal(created.body.email, 'test@example.com');
    assert.equal(created.body.status, 'active');

    const patched = await api.patch(`/api/users/${created.body.id}`).send({ status: 'inactive' }).expect(200);
    assert.equal(patched.body.status, 'inactive');
    assert.equal(patched.body.name, 'Test User');

    await api.delete(`/api/users/${created.body.id}`).expect(204);
    await api.get(`/api/users/${created.body.id}`).expect(404);
  });

  it('rejects invalid payloads and duplicated emails', async () => {
    const invalid = await api.post('/api/users').send({ name: 'A', email: 'nope' }).expect(400);
    assert.deepEqual(invalid.body.error.details.map((d) => d.field).sort(), ['email', 'name']);
    await api.post('/api/users').send({ name: 'Alice', email: 'alice@example.com' }).expect(409);
  });

  it('does not delete a user that authored courses', async () => {
    await api.delete('/api/users/1').expect(409);
  });
});

describe('Courses, modules and contents', () => {
  it('returns computed counters for a course', async () => {
    const res = await api.get('/api/courses/1').expect(200);
    assert.equal(res.body.modules_count, 5);
    assert.equal(res.body.contents_count, 15);
    assert.equal(res.body.user_name, 'Alice Johnson');
  });

  it('filters modules by course and contents by module', async () => {
    const modules = await api.get('/api/modules?course_id=2').expect(200);
    assert.equal(modules.body.meta.total, 3);
    const contents = await api.get(`/api/contents?module_id=${modules.body.data[0].id}`).expect(200);
    assert.equal(contents.body.meta.total, 5);
  });

  it('validates foreign keys', async () => {
    await api.post('/api/courses').send({ code: 'X-1', title: 'Orphan', user_id: 999 }).expect(409);
  });

  it('cascades course deletion to modules and contents', async () => {
    const course = await api.post('/api/courses').send({ code: 'tmp-1', title: 'Temporary', user_id: 2 }).expect(201);
    assert.equal(course.body.code, 'TMP-1');
    const mod = await api
      .post('/api/modules')
      .send({ course_id: course.body.id, user_id: 2, title: 'Temp module' })
      .expect(201);
    const content = await api
      .post('/api/contents')
      .send({ module_id: mod.body.id, title: 'Temp lesson', content: 'Body' })
      .expect(201);

    await api.delete(`/api/courses/${course.body.id}`).expect(204);
    await api.get(`/api/modules/${mod.body.id}`).expect(404);
    await api.get(`/api/contents/${content.body.id}`).expect(404);
  });
});

describe('Content views', () => {
  it('marks and unmarks a content as watched', async () => {
    await api.post('/api/contents/2/views').send({ user_id: 2 }).expect(201);
    // Idempotent: watching again does not duplicate the record.
    await api.post('/api/contents/2/views').send({ user_id: 2 }).expect(201);
    let viewers = await api.get('/api/contents/2/views').expect(200);
    assert.deepEqual(viewers.body.map((v) => v.id).sort(), [1, 2, 3, 4]);

    await api.delete('/api/contents/2/views/2').expect(204);
    viewers = await api.get('/api/contents/2/views').expect(200);
    assert.deepEqual(viewers.body.map((v) => v.id).sort(), [1, 3, 4]);
  });

  it('returns 404 for an unknown content', async () => {
    await api.get('/api/contents/9999/views').expect(404);
  });
});

describe('Reports', () => {
  it('SQL 01 - users with most courses', async () => {
    const res = await api.get('/api/reports/users-most-courses').expect(200);
    assert.equal(res.body[0].name, 'Alice Johnson');
    assert.equal(res.body[0].total_courses, 3);
    assert.equal(res.body.length, 5);
  });

  it('SQL 02 - course with most contents includes ties', async () => {
    const res = await api.get('/api/reports/course-most-contents').expect(200);
    assert.deepEqual(res.body.map((c) => [c.code, c.total_contents]), [
      ['NODE-101', 15],
      ['REACT-101', 15],
    ]);
  });

  it('SQL 03 - courses summary', async () => {
    const res = await api.get('/api/reports/courses-summary').expect(200);
    assert.deepEqual(
      res.body.slice(0, 3).map((c) => [c.total_modules, c.total_contents]),
      [[5, 15], [3, 15], [2, 8]],
    );
  });

  it('SQL 04 - contents with course name', async () => {
    const res = await api.get('/api/reports/contents-with-course').expect(200);
    assert.equal(res.body.length, 41);
    assert.equal(res.body[0].course_title, 'Node.js Fundamentals');
  });

  it('SQL 05 - users who watched content 2', async () => {
    const res = await api.get('/api/reports/content-viewers/2').expect(200);
    assert.deepEqual(res.body.map((u) => u.name), ['Alice Johnson', 'Carla Souza', 'Daniel Costa']);
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
  });
});
