import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Icon from '../../../design-system/Icon';
import { ErrorAlert, Skeleton } from '../../../design-system/Feedback';
import { ProgressRing } from '../../../design-system/Progress';
import { rise } from '../../../design-system/motion/variants';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { duration, ratio } from '../../../shared/lib/format';
import { learnerApi } from '../learner.api';
import CourseOutline from '../components/CourseOutline';
import '../learner.css';

export default function CoursePage() {
  const { id } = useParams();
  const { t, apiMessage } = useI18n();
  const { data: course, error, reload } = useAsync((signal) => learnerApi.course(id, signal), [id]);

  if (error) return <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>;
  if (!course) {
    return (
      <div className="stack" aria-busy="true">
        <Skeleton width={140} />
        <Skeleton width="55%" height={40} />
        <Skeleton height={320} style={{ borderRadius: 24 }} />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const progress = ratio(course.completed_lessons, course.lessons_count);
  const started = course.modules.some((m) => m.lessons.some((l) => l.completed_at || l.position_seconds > 0));
  const nextLesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === course.next_lesson_id);
  const cta = progress >= 1 ? 'course.review' : started ? 'course.continue' : 'course.start';

  return (
    <>
      <motion.nav className="breadcrumb" variants={rise} aria-label={t('nav.breadcrumb')}>
        <Link to="/app/catalog">{t('nav.catalog')}</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{course.title}</span>
      </motion.nav>

      <GlassView as={motion.header} className="course-hero" variants={rise}>
        <div className="course-hero-copy">
          <code className="course-code">{course.code}</code>
          <h1>{course.title}</h1>
          {course.description && <p className="muted">{course.description}</p>}
          <ul className="course-meta">
            <li>
              <Icon name="user" size={14} /> {course.author_name}
            </li>
            <li>
              <Icon name="video" size={14} /> {t('course.lessonsCount', { count: course.lessons_count })}
            </li>
            {course.total_seconds > 0 && (
              <li>
                <Icon name="clock" size={14} /> {duration(course.total_seconds)}
              </li>
            )}
            {!course.published && <li className="badge badge-draft">{t('status.draft')}</li>}
          </ul>
        </div>
        <div className="course-hero-progress">
          <ProgressRing value={progress} size={104} stroke={8} label={t('course.progressLabel', { title: course.title })} />
          <span className="small muted">{t('course.completedOf', { done: course.completed_lessons, total: course.lessons_count })}</span>
          {nextLesson && (
            <Link to={`/app/lessons/${nextLesson.id}`} className="btn btn-primary btn-lg">
              <Icon name="play" size={16} filled />
              {t(cta)}
            </Link>
          )}
        </div>
      </GlassView>

      <motion.section variants={rise} className="course-outline-section">
        <h2 className="sr-only">{t('course.contents')}</h2>
        <CourseOutline modules={course.modules} currentLessonId={progress < 1 ? course.next_lesson_id : null} />
      </motion.section>
    </>
  );
}
