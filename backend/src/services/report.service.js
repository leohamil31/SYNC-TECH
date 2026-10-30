const db = require('../db/connection');

/*
 * Report queries. They mirror sql/reports.sql; COUNT() returns bigint in
 * PostgreSQL (serialized as string by node-postgres), hence the ::int casts.
 */

// SQL 01 - Users with the most courses.
const usersWithMostCourses = async () => {
  const { rows } = await db.raw(`
    SELECT u.id, u.name, u.email, COUNT(c.id)::int AS total_courses
    FROM users u
    LEFT JOIN courses c ON c.user_id = u.id
    GROUP BY u.id, u.name, u.email
    ORDER BY total_courses DESC, u.name ASC
  `);
  return rows;
};

// SQL 02 - Course(s) with the most contents (ties are all returned).
const courseWithMostContents = async () => {
  const { rows } = await db.raw(`
    SELECT id, code, title, total_contents
    FROM (
      SELECT c.id, c.code, c.title,
             COUNT(ct.id)::int AS total_contents,
             RANK() OVER (ORDER BY COUNT(ct.id) DESC) AS position
      FROM courses c
      LEFT JOIN modules m ON m.course_id = c.id
      LEFT JOIN contents ct ON ct.module_id = m.id
      GROUP BY c.id, c.code, c.title
    ) ranked
    WHERE position = 1
    ORDER BY id
  `);
  return rows;
};

// SQL 03 - Every course with its total of modules and contents.
const coursesSummary = async () => {
  const { rows } = await db.raw(`
    SELECT c.id, c.code, c.title,
           COUNT(DISTINCT m.id)::int AS total_modules,
           COUNT(ct.id)::int AS total_contents
    FROM courses c
    LEFT JOIN modules m ON m.course_id = c.id
    LEFT JOIN contents ct ON ct.module_id = m.id
    GROUP BY c.id, c.code, c.title
    ORDER BY c.id
  `);
  return rows;
};

// SQL 04 - Every content with its course name.
const contentsWithCourse = async () => {
  const { rows } = await db.raw(`
    SELECT ct.id, ct.title AS content_title,
           m.id AS module_id, m.title AS module_title,
           c.id AS course_id, c.title AS course_title
    FROM contents ct
    INNER JOIN modules m ON m.id = ct.module_id
    INNER JOIN courses c ON c.id = m.course_id
    ORDER BY c.id, m.id, ct.id
  `);
  return rows;
};

// SQL 05 - Users who watched a given content (the test asks for id = 2).
const contentViewers = async (contentId) => {
  const { rows } = await db.raw(
    `
    SELECT u.id, u.name, u.email, cv.watched_at
    FROM content_views cv
    INNER JOIN users u ON u.id = cv.user_id
    WHERE cv.content_id = ?
    ORDER BY cv.watched_at, u.name
  `,
    [contentId],
  );
  return rows;
};

module.exports = {
  usersWithMostCourses,
  courseWithMostContents,
  coursesSummary,
  contentsWithCourse,
  contentViewers,
};
