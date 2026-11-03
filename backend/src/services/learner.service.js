const db = require('../db/connection');
const HttpError = require('../utils/http-error');

/*
 * Learner-facing reads and progress writes. Every query is scoped to the
 * authenticated user; unpublished courses are visible to admins only (preview).
 */

const LESSON_ORDER = ['m.id', 'ct.position', 'ct.id'];

const coverSubquery = `(
  SELECT ct2.video_url FROM contents ct2
  JOIN modules m2 ON m2.id = ct2.module_id
  WHERE m2.course_id = c.id AND ct2.video_url IS NOT NULL
  ORDER BY m2.id, ct2.position, ct2.id
  LIMIT 1
)`;

/** Published courses with the learner's progress. One row per course. */
const listCourses = async (user, { search } = {}) => {
  const query = db('courses as c')
    .join('users as u', 'u.id', 'c.user_id')
    .leftJoin('modules as m', 'm.course_id', 'c.id')
    .leftJoin('contents as ct', 'ct.module_id', 'm.id')
    // At most one progress row per (user, content), so this join never duplicates lessons.
    .leftJoin('content_views as cv', (join) => {
      join.on('cv.content_id', 'ct.id').andOn('cv.user_id', db.raw('?', [user.id]));
    })
    .select(
      'c.id',
      'c.code',
      'c.title',
      'c.description',
      'c.published',
      'u.name as author_name',
      db.raw('COUNT(DISTINCT m.id)::int AS modules_count'),
      db.raw('COUNT(ct.id)::int AS lessons_count'),
      db.raw('COALESCE(SUM(ct.duration_seconds), 0)::int AS total_seconds'),
      db.raw('COUNT(cv.completed_at)::int AS completed_lessons'),
      db.raw('COUNT(cv.id)::int AS started_lessons'),
      db.raw('MAX(cv.updated_at) AS last_activity_at'),
      db.raw(`${coverSubquery} AS cover_video_url`),
    )
    .groupBy('c.id', 'u.name')
    .orderBy('c.id');

  if (user.role !== 'admin') query.where('c.published', true);
  if (search) {
    query.where((b) => b.whereILike('c.title', `%${search}%`).orWhereILike('c.code', `%${search}%`).orWhereILike('c.description', `%${search}%`));
  }
  return query;
};

const findCourse = async (user, courseId) => {
  const course = await db('courses as c')
    .join('users as u', 'u.id', 'c.user_id')
    .select('c.id', 'c.code', 'c.title', 'c.description', 'c.published', 'c.updated_at', 'u.name as author_name')
    .where('c.id', courseId)
    .first();
  // Unpublished courses answer 404 (not 403) so their existence is not leaked to students.
  if (!course || (!course.published && user.role !== 'admin')) throw HttpError.notFound(`Course ${courseId} not found`);
  return course;
};

/** Ordered lessons of a course joined with the learner's progress. */
const courseLessons = (user, courseId) =>
  db('contents as ct')
    .join('modules as m', 'm.id', 'ct.module_id')
    .leftJoin('content_views as cv', (join) => {
      join.on('cv.content_id', 'ct.id').andOn('cv.user_id', db.raw('?', [user.id]));
    })
    .select(
      'ct.id',
      'ct.title',
      'ct.module_id',
      'ct.video_url',
      'ct.duration_seconds',
      'ct.position',
      db.raw('COALESCE(cv.position_seconds, 0)::int AS position_seconds'),
      'cv.completed_at',
      'cv.updated_at as last_activity_at',
    )
    .where('m.course_id', courseId)
    .orderBy(LESSON_ORDER);

/** Course page: modules with lessons, totals and the lesson to continue from. */
const getCourse = async (user, courseId) => {
  const course = await findCourse(user, courseId);
  const [modules, lessons] = await Promise.all([
    db('modules').select('id', 'title', 'description').where({ course_id: courseId }).orderBy('id'),
    courseLessons(user, courseId),
  ]);

  const completed = lessons.filter((l) => l.completed_at).length;
  const nextLesson = lessons.find((l) => !l.completed_at) ?? lessons[0] ?? null;

  return {
    ...course,
    lessons_count: lessons.length,
    completed_lessons: completed,
    total_seconds: lessons.reduce((sum, l) => sum + (l.duration_seconds || 0), 0),
    next_lesson_id: nextLesson?.id ?? null,
    modules: modules.map((mod) => ({ ...mod, lessons: lessons.filter((l) => l.module_id === mod.id) })),
  };
};

/** Lesson player data: the lesson, its course outline position and the learner's progress. */
const getLesson = async (user, lessonId) => {
  const lesson = await db('contents as ct')
    .join('modules as m', 'm.id', 'ct.module_id')
    .select('ct.*', 'm.title as module_title', 'm.course_id')
    .where('ct.id', lessonId)
    .first();
  if (!lesson) throw HttpError.notFound(`Content ${lessonId} not found`);

  const course = await findCourse(user, lesson.course_id);
  const lessons = await courseLessons(user, lesson.course_id);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const progress = lessons[index];

  return {
    id: lesson.id,
    title: lesson.title,
    content: lesson.content,
    video_url: lesson.video_url,
    duration_seconds: lesson.duration_seconds,
    module_id: lesson.module_id,
    module_title: lesson.module_title,
    course: { id: course.id, code: course.code, title: course.title },
    position_seconds: progress.position_seconds,
    completed_at: progress.completed_at,
    index: index + 1,
    total: lessons.length,
    previous_lesson_id: lessons[index - 1]?.id ?? null,
    next_lesson_id: lessons[index + 1]?.id ?? null,
  };
};

/**
 * Upserts progress. `completed: true` keeps the first completion date,
 * `completed: false` clears it, omitted leaves it untouched.
 */
const saveProgress = async (user, lessonId, { position_seconds: position, completed }) => {
  await getLessonAccess(user, lessonId);

  const merge = { updated_at: db.fn.now() };
  if (position !== undefined) merge.position_seconds = position;
  if (completed === true) merge.completed_at = db.raw('COALESCE(content_views.completed_at, now())');
  if (completed === false) merge.completed_at = null;

  const [row] = await db('content_views')
    .insert({
      user_id: user.id,
      content_id: lessonId,
      position_seconds: position ?? 0,
      completed_at: completed ? db.fn.now() : null,
    })
    .onConflict(['user_id', 'content_id'])
    .merge(merge)
    .returning(['content_id', 'position_seconds', 'watched_at', 'completed_at', 'updated_at']);
  return row;
};

const resetProgress = async (user, lessonId) => {
  await getLessonAccess(user, lessonId);
  await db('content_views').where({ user_id: user.id, content_id: lessonId }).del();
};

/** Throws 404 when the lesson does not exist or belongs to a course the user cannot see. */
const getLessonAccess = async (user, lessonId) => {
  const row = await db('contents as ct')
    .join('modules as m', 'm.id', 'ct.module_id')
    .join('courses as c', 'c.id', 'm.course_id')
    .select('c.published')
    .where('ct.id', lessonId)
    .first();
  if (!row || (!row.published && user.role !== 'admin')) throw HttpError.notFound(`Content ${lessonId} not found`);
};

/** Dashboard numbers and the lesson to resume. */
const getSummary = async (user) => {
  const [totals] = await db('content_views as cv')
    .join('contents as ct', 'ct.id', 'cv.content_id')
    .where('cv.user_id', user.id)
    .select(
      db.raw('COUNT(cv.completed_at)::int AS completed_lessons'),
      // Completed lessons count their full duration; unfinished ones count the resume position.
      db.raw(`COALESCE(SUM(CASE WHEN cv.completed_at IS NOT NULL THEN COALESCE(ct.duration_seconds, cv.position_seconds)
                                ELSE cv.position_seconds END), 0)::int AS watched_seconds`),
    );

  const resume = await db('content_views as cv')
    .join('contents as ct', 'ct.id', 'cv.content_id')
    .join('modules as m', 'm.id', 'ct.module_id')
    .join('courses as c', 'c.id', 'm.course_id')
    .select(
      'ct.id',
      'ct.title',
      'ct.video_url',
      'ct.duration_seconds',
      'cv.position_seconds',
      'cv.updated_at',
      'c.id as course_id',
      'c.title as course_title',
    )
    .where('cv.user_id', user.id)
    .whereNull('cv.completed_at')
    .modify((q) => user.role !== 'admin' && q.where('c.published', true))
    .orderBy('cv.updated_at', 'desc')
    .first();

  const courses = await listCourses(user);
  const started = courses.filter((c) => c.started_lessons > 0);

  return {
    ...totals,
    courses_in_progress: started.filter((c) => c.completed_lessons < c.lessons_count).length,
    courses_completed: started.filter((c) => c.lessons_count > 0 && c.completed_lessons === c.lessons_count).length,
    resume: resume ?? null,
  };
};

module.exports = { listCourses, getCourse, getLesson, saveProgress, resetProgress, getSummary };
