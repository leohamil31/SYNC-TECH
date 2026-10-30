-- =====================================================================
-- Reports - Course Manager
-- The same queries are exposed by the API under /api/reports/*
-- (see src/services/report.service.js).
-- =====================================================================

-- SQL 01 - Which users own the most courses?
-- LEFT JOIN keeps users without courses (total = 0) in the ranking.
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(c.id) AS total_courses
FROM users u
LEFT JOIN courses c ON c.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY total_courses DESC, u.name ASC;


-- SQL 02 - Which course has the most contents?
-- RANK() returns every course tied in first place instead of picking one
-- arbitrarily (a plain ORDER BY ... LIMIT 1 would hide ties).
SELECT id, code, title, total_contents
FROM (
  SELECT
    c.id,
    c.code,
    c.title,
    COUNT(ct.id) AS total_contents,
    RANK() OVER (ORDER BY COUNT(ct.id) DESC) AS position
  FROM courses c
  LEFT JOIN modules m ON m.course_id = c.id
  LEFT JOIN contents ct ON ct.module_id = m.id
  GROUP BY c.id, c.code, c.title
) ranked
WHERE position = 1
ORDER BY id;


-- SQL 03 - All courses with their total of modules and contents (1 query).
-- COUNT(DISTINCT m.id) avoids counting a module once per content row.
SELECT
  c.id,
  c.code,
  c.title,
  COUNT(DISTINCT m.id) AS total_modules,
  COUNT(ct.id)         AS total_contents
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN contents ct ON ct.module_id = m.id
GROUP BY c.id, c.code, c.title
ORDER BY c.id;


-- SQL 04 - All contents with the course name (1 query).
SELECT
  ct.id,
  ct.title  AS content_title,
  m.id      AS module_id,
  m.title   AS module_title,
  c.id      AS course_id,
  c.title   AS course_title
FROM contents ct
INNER JOIN modules m ON m.id = ct.module_id
INNER JOIN courses c ON c.id = m.course_id
ORDER BY c.id, m.id, ct.id;


-- SQL 05 - Which users have already watched the lesson (content ID = 2)?
-- Modeled with the N:N table content_views (user_id, content_id, watched_at)
-- with a UNIQUE (user_id, content_id) constraint.
SELECT
  u.id,
  u.name,
  u.email,
  cv.watched_at
FROM content_views cv
INNER JOIN users u ON u.id = cv.user_id
WHERE cv.content_id = 2
ORDER BY cv.watched_at, u.name;
