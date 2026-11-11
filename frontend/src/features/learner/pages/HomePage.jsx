import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Icon from '../../../design-system/Icon';
import CountUp from '../../../design-system/motion/CountUp';
import Reveal from '../../../design-system/motion/Reveal';
import TextReveal from '../../../design-system/motion/TextReveal';
import { ErrorAlert, Skeleton } from '../../../design-system/Feedback';
import { ProgressBar } from '../../../design-system/Progress';
import { ease } from '../../../design-system/motion/variants';
import { useAuth } from '../../auth/AuthProvider';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { clock, ratio } from '../../../shared/lib/format';
import { courseStatus, learnerApi } from '../learner.api';
import CourseCard from '../components/CourseCard';
import VideoThumb from '../components/VideoThumb';
import '../learner.css';

const minutes = (seconds) => Math.round(seconds / 60);
const item = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease } } };

/**
 * The page's one orchestrated moment: the greeting assembles, then the resume card
 * opens up (thumbnail settles, copy slides in, play button springs and starts pulsing).
 */
function ResumeCard({ resume, firstCourse }) {
  const { t } = useI18n();
  if (!resume && !firstCourse) return null;

  const to = resume ? `/app/lessons/${resume.id}` : `/app/courses/${firstCourse.id}`;
  const progress = resume?.duration_seconds ? ratio(resume.position_seconds, resume.duration_seconds) : 0;
  const action = resume && resume.position_seconds > 0 ? t('home.resumeAction', { time: clock(resume.position_seconds) }) : t('home.startAction');
  const label = resume ? t('home.resumeLabel') : t('home.startLabel');

  return (
    <GlassView
      as={motion.section}
      className="resume"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease, delay: 0.25 }}
      aria-label={label}
    >
      <Link to={to} className="resume-media" tabIndex={-1} aria-hidden="true">
        <motion.div className="resume-media-inner" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease }}>
          <VideoThumb videoUrl={resume ? resume.video_url : firstCourse.cover_video_url} />
        </motion.div>
        <motion.span
          className="play-badge pulse-ring"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.7 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
        >
          <Icon name="play" size={22} filled />
        </motion.span>
      </Link>

      <motion.div
        className="resume-body"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { delayChildren: 0.45, staggerChildren: 0.08 } } }}
      >
        <motion.span variants={item} className="resume-label">
          <span className="live-dot" /> {label}
        </motion.span>
        <motion.h2 variants={item}>{resume ? resume.title : firstCourse.title}</motion.h2>
        <motion.p variants={item} className="muted">
          {resume ? resume.course_title : firstCourse.description}
        </motion.p>
        {resume && resume.duration_seconds > 0 && (
          <motion.div variants={item} className="resume-progress">
            <ProgressBar value={progress} label={t('lesson.watched')} />
            <span className="small muted">
              {clock(resume.position_seconds)} / {clock(resume.duration_seconds)}
            </span>
          </motion.div>
        )}
        <motion.div variants={item}>
          <Link to={to} className="btn btn-primary btn-lg">
            <Icon name="play" size={16} filled />
            {action}
          </Link>
        </motion.div>
      </motion.div>
    </GlassView>
  );
}

/** Learner start page: greeting, the lesson to resume, three numbers and up to three courses. */
export default function HomePage() {
  const { t, apiMessage } = useI18n();
  const { user } = useAuth();
  const { data, error, reload } = useAsync(async (signal) => {
    const [summary, courses] = await Promise.all([learnerApi.summary(signal), learnerApi.courses({}, signal)]);
    return { summary, courses };
  }, []);

  if (error && !data) return <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>;

  if (!data) {
    return (
      <div aria-busy="true" className="stack">
        <Skeleton width="40%" height={40} />
        <Skeleton height={300} style={{ borderRadius: 24 }} />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const { summary, courses } = data;
  const inProgress = courses.filter((c) => courseStatus(c) === 'inProgress');
  const fresh = courses.filter((c) => courseStatus(c) === 'notStarted');
  const shelf = inProgress.length ? inProgress.slice(0, 3) : fresh.slice(0, 3);

  const stats = [
    ['checkCircle', summary.completed_lessons, t('home.statLessons', { count: summary.completed_lessons })],
    ['clock', minutes(summary.watched_seconds), t('home.statMinutes', { count: minutes(summary.watched_seconds) })],
    ['book', summary.courses_in_progress, t('home.statInProgress', { count: summary.courses_in_progress })],
  ];

  return (
    <div className="home">
      <header className="home-header">
        <TextReveal className="text-shine" text={t('home.greeting', { name: user.name.split(' ')[0] })} />
        <motion.p className="muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.6 }}>
          {summary.completed_lessons ? t('home.subtitle') : t('home.subtitleNew')}
        </motion.p>
      </header>

      <ResumeCard resume={summary.resume} firstCourse={fresh[0] || courses[0]} />

      <dl className="stats">
        {stats.map(([icon, value, label], i) => (
          <Reveal key={icon} className="stat" delay={0.6 + i * 0.08} y={12}>
            <Icon name={icon} size={18} />
            <dt>{label}</dt>
            <dd>
              <CountUp value={value} duration={1.4} />
            </dd>
          </Reveal>
        ))}
      </dl>

      {shelf.length > 0 && (
        <section className="home-shelf">
          <Reveal as="header" className="section-title">
            <h2>{inProgress.length ? t('home.myCourses') : t('home.startCourse')}</h2>
            <Link to="/app/catalog" className="btn btn-ghost btn-sm">
              {t('home.seeCatalog')}
              <Icon name="chevronRight" size={14} />
            </Link>
          </Reveal>
          <ul className="course-grid">
            {shelf.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
