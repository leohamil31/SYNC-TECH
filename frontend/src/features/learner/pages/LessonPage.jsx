import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Icon from '../../../design-system/Icon';
import { ErrorAlert, Skeleton } from '../../../design-system/Feedback';
import { ProgressBar } from '../../../design-system/Progress';
import { useToast } from '../../../design-system/Toast';
import { rise, spring } from '../../../design-system/motion/variants';
import Burst from '../../../design-system/motion/Burst';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { ratio } from '../../../shared/lib/format';
import { learnerApi } from '../learner.api';
import CourseOutline from '../components/CourseOutline';
import YouTubePlayer from '../components/YouTubePlayer';
import '../learner.css';

const SAVE_EVERY_SECONDS = 10;
const AUTO_COMPLETE_AT = 0.9; // 90% watched counts as completed

/**
 * Lesson player. Progress is saved while the video plays, when it pauses,
 * when the learner leaves the page and when the tab is hidden.
 */
export default function LessonPage() {
  const { id } = useParams();
  const { t, apiMessage } = useI18n();
  const notify = useToast();

  const lessonQuery = useAsync((signal) => learnerApi.lesson(id, signal), [id]);
  const lesson = lessonQuery.data;
  const courseId = lesson?.course.id;
  const courseQuery = useAsync((signal) => (courseId ? learnerApi.course(courseId, signal) : Promise.resolve(null)), [courseId]);
  const { setData: setCourse } = courseQuery;

  const [completedAt, setCompletedAt] = useState(null);
  const [celebrate, setCelebrate] = useState(0);
  const completedRef = useRef(null);
  const positionRef = useRef(0);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    if (!lesson) return;
    setCompletedAt(lesson.completed_at);
    completedRef.current = lesson.completed_at;
    positionRef.current = lesson.position_seconds;
    lastSavedRef.current = lesson.position_seconds;
  }, [lesson]);

  /** Keeps the sidebar outline and course counters in sync without refetching. */
  const patchOutline = useCallback(
    (changes) =>
      setCourse((course) => {
        if (!course) return course;
        const modules = course.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => (l.id === Number(id) ? { ...l, ...changes } : l)),
        }));
        const completed = modules.flatMap((m) => m.lessons).filter((l) => l.completed_at).length;
        return { ...course, modules, completed_lessons: completed };
      }),
    [id, setCourse],
  );

  const save = useCallback(
    async (payload, options) => {
      try {
        return await learnerApi.saveProgress(id, payload, options);
      } catch (error) {
        if (!options?.keepalive) notify(apiMessage(error.message), 'error');
        return null;
      }
    },
    [id, notify, apiMessage],
  );

  const setCompleted = useCallback(
    async (completed) => {
      const optimistic = completed ? new Date().toISOString() : null;
      completedRef.current = optimistic;
      setCompletedAt(optimistic);
      if (completed) setCelebrate((n) => n + 1);
      patchOutline({ completed_at: optimistic });
      const row = await save({ completed, position_seconds: Math.floor(positionRef.current) });
      if (row) {
        completedRef.current = row.completed_at;
        setCompletedAt(row.completed_at);
        patchOutline({ completed_at: row.completed_at });
        notify(completed ? t('lesson.completedToast') : t('lesson.reopenedToast'));
      }
    },
    [save, patchOutline, notify, t],
  );

  const handleProgress = useCallback(
    (seconds, total) => {
      positionRef.current = seconds;
      if (!completedRef.current && total > 0 && seconds / total >= AUTO_COMPLETE_AT) {
        setCompleted(true);
        return;
      }
      if (Math.abs(seconds - lastSavedRef.current) >= SAVE_EVERY_SECONDS) {
        lastSavedRef.current = seconds;
        save({ position_seconds: Math.floor(seconds) });
        patchOutline({ position_seconds: Math.floor(seconds) });
      }
    },
    [save, setCompleted, patchOutline],
  );

  const handleEnded = useCallback(() => {
    if (!completedRef.current) setCompleted(true);
  }, [setCompleted]);

  // Leaving the tab: flush the position with a request that survives page unload.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== 'hidden' || !lesson) return;
      if (Math.abs(positionRef.current - lastSavedRef.current) < 1) return;
      lastSavedRef.current = positionRef.current;
      save({ position_seconds: Math.floor(positionRef.current) }, { keepalive: true });
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [lesson, save]);

  if (lessonQuery.error) {
    return <ErrorAlert onRetry={lessonQuery.reload} retryLabel={t('actions.retry')}>{apiMessage(lessonQuery.error.message)}</ErrorAlert>;
  }
  if (!lesson) {
    return (
      <div className="lesson-layout" aria-busy="true">
        <div className="stack">
          <Skeleton height={0} style={{ aspectRatio: '16 / 9', height: 'auto', borderRadius: 24 }} />
          <Skeleton width="60%" height={28} />
        </div>
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const course = courseQuery.data;
  const done = Boolean(completedAt);

  return (
    <div className="lesson-layout">
      <div className="lesson-main">
        <motion.nav className="breadcrumb" variants={rise} aria-label={t('nav.breadcrumb')}>
          <Link to={`/app/courses/${lesson.course.id}`}>{lesson.course.title}</Link>
          <Icon name="chevronRight" size={14} />
          <span>{lesson.module_title}</span>
        </motion.nav>

        <GlassView as={motion.div} className="player-shell" variants={rise}>
          <YouTubePlayer
            videoUrl={lesson.video_url}
            startAt={lesson.completed_at ? 0 : lesson.position_seconds}
            title={lesson.title}
            onProgress={handleProgress}
            onEnded={handleEnded}
          />
        </GlassView>

        <motion.header className="lesson-header" variants={rise}>
          <div>
            <span className="muted small">{t('lesson.position', { index: lesson.index, total: lesson.total })}</span>
            <h1>{lesson.title}</h1>
          </div>
          <span className="burst-host">
          <Burst trigger={celebrate} />
          <motion.button
            type="button"
            className={`btn complete-toggle${done ? ' is-done' : ''}`}
            onClick={() => setCompleted(!done)}
            aria-pressed={done}
            whileTap={{ scale: 0.94 }}
            layout
            transition={spring}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={done ? 'done' : 'todo'}
                className="row"
                style={{ gap: 8 }}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={spring}
              >
                <Icon name={done ? 'checkCircle' : 'circle'} size={16} />
                {done ? t('lesson.completed') : t('lesson.markComplete')}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          </span>
        </motion.header>

        {lesson.content && (
          <motion.p className="lesson-description" variants={rise}>
            {lesson.content}
          </motion.p>
        )}

        <motion.nav className="lesson-nav" variants={rise} aria-label={t('lesson.navigation')}>
          {lesson.previous_lesson_id ? (
            <Link to={`/app/lessons/${lesson.previous_lesson_id}`} className="btn btn-ghost">
              <Icon name="chevronLeft" size={16} /> {t('lesson.previous')}
            </Link>
          ) : (
            <span />
          )}
          {lesson.next_lesson_id ? (
            <Link to={`/app/lessons/${lesson.next_lesson_id}`} className={`btn ${done ? 'btn-primary btn-lg next-ready' : ''}`}>
              {t('lesson.next')} <Icon name="chevronRight" size={16} />
            </Link>
          ) : (
            done && (
              <Link to={`/app/courses/${lesson.course.id}`} className="btn btn-primary btn-lg">
                <Icon name="checkCircle" size={16} /> {t('lesson.finishCourse')}
              </Link>
            )
          )}
        </motion.nav>
      </div>

      <GlassView as={motion.aside} className="lesson-aside" variants={rise} aria-label={t('course.contents')}>
        {course ? (
          <>
            <div className="lesson-aside-head">
              <strong>{course.title}</strong>
              <ProgressBar value={ratio(course.completed_lessons, course.lessons_count)} label={t('course.progressLabel', { title: course.title })} />
              <span className="small muted">{t('course.completedOf', { done: course.completed_lessons, total: course.lessons_count })}</span>
            </div>
            <CourseOutline modules={course.modules} currentLessonId={lesson.id} compact />
          </>
        ) : (
          <div className="stack">
            <Skeleton width="70%" />
            <Skeleton />
            <Skeleton width="85%" />
          </div>
        )}
      </GlassView>
    </div>
  );
}
