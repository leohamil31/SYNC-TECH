import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../../../design-system/Icon';
import { spring } from '../../../design-system/motion/variants';
import { useI18n } from '../../../shared/i18n';
import { clock } from '../../../shared/lib/format';

function LessonStatus({ lesson }) {
  const { t } = useI18n();
  const done = Boolean(lesson.completed_at);
  const started = !done && lesson.position_seconds > 0;
  return (
    <span className={`lesson-status${done ? ' is-done' : started ? ' is-started' : ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={done ? 'done' : started ? 'started' : 'todo'}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={spring}
          style={{ display: 'grid' }}
        >
          <Icon name={done ? 'check' : started ? 'play' : 'circle'} size={done ? 14 : 12} strokeWidth={done ? 3 : 2} filled={started} />
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">{done ? t('lesson.statusDone') : started ? t('lesson.statusStarted') : t('lesson.statusTodo')}</span>
    </span>
  );
}

/**
 * Modules and lessons of a course with per-lesson status.
 * Modules and lessons are a real sequence, so they are numbered.
 */
export default function CourseOutline({ modules, currentLessonId, compact = false }) {
  const { t } = useI18n();
  let counter = 0;

  return (
    <ol className={`outline${compact ? ' outline-compact' : ''}`}>
      {modules.map((mod, moduleIndex) => {
        const done = mod.lessons.filter((l) => l.completed_at).length;
        return (
          <li key={mod.id} className="outline-module">
            <header>
              <span className="outline-module-index">{t('course.moduleN', { n: moduleIndex + 1 })}</span>
              <h3>{mod.title}</h3>
              <span className="muted small">
                {done}/{mod.lessons.length}
              </span>
            </header>
            {!compact && mod.description && <p className="muted small outline-module-desc">{mod.description}</p>}
            <ol className="outline-lessons">
              {mod.lessons.length === 0 && <li className="muted small outline-empty">{t('course.noLessonsYet')}</li>}
              {mod.lessons.map((lesson) => {
                counter += 1;
                const current = lesson.id === currentLessonId;
                return (
                  <li key={lesson.id}>
                    <Link
                      to={`/app/lessons/${lesson.id}`}
                      className={`outline-lesson${current ? ' is-current' : ''}`}
                      aria-current={current ? 'step' : undefined}
                    >
                      {current && <motion.span layoutId="outline-current" className="outline-current" transition={spring} />}
                      <LessonStatus lesson={lesson} />
                      <span className="outline-lesson-title">
                        <span className="outline-lesson-n">{counter}.</span> {lesson.title}
                      </span>
                      {lesson.duration_seconds && <span className="outline-lesson-time">{clock(lesson.duration_seconds)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
