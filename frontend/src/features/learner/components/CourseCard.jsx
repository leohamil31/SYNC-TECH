import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import { ProgressBar } from '../../../design-system/Progress';
import { ease } from '../../../design-system/motion/variants';
import { useTilt } from '../../../design-system/motion/useTilt';
import { useI18n } from '../../../shared/i18n';
import { duration, ratio } from '../../../shared/lib/format';
import { courseStatus } from '../learner.api';
import VideoThumb from './VideoThumb';

const MotionLink = motion.create(Link);

/** Course tile: rises into view, tilts toward the pointer and zooms its thumbnail on hover. */
export default function CourseCard({ course, index = 0 }) {
  const { t } = useI18n();
  const tilt = useTilt(5);
  const status = courseStatus(course);
  const progress = ratio(course.completed_lessons, course.lessons_count);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.55, ease, delay: Math.min(index, 6) * 0.07 }}
    >
      <GlassView
        as={MotionLink}
        to={`/app/courses/${course.id}`}
        isInteractive
        className="course-card"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.985 }}
        {...tilt}
      >
        <VideoThumb videoUrl={course.cover_video_url} className="thumb-zoom">
          {!course.published && <span className="badge badge-draft thumb-badge">{t('status.draft')}</span>}
        </VideoThumb>
        <div className="course-card-body">
          <code className="course-code">{course.code}</code>
          <h3>{course.title}</h3>
          <p className="muted small">
            {t('course.lessonsCount', { count: course.lessons_count })}
            {course.total_seconds > 0 && `, ${duration(course.total_seconds)}`}
          </p>
        </div>
        <div className="course-card-progress">
          <ProgressBar value={progress} label={t('course.progressLabel', { title: course.title })} />
          <span className={`small status-${status}`}>
            {status === 'notStarted'
              ? t('course.notStarted')
              : t('course.completedOf', { done: course.completed_lessons, total: course.lessons_count })}
          </span>
        </div>
      </GlassView>
    </motion.li>
  );
}
