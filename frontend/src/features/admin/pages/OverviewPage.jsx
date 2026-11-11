import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassView from '../../../design-system/GlassView';
import Accent from '../../../design-system/Accent';
import Avatar from '../../../design-system/Avatar';
import Icon from '../../../design-system/Icon';
import CountUp from '../../../design-system/motion/CountUp';
import Reveal from '../../../design-system/motion/Reveal';
import TextReveal from '../../../design-system/motion/TextReveal';
import { EmptyState, ErrorAlert, Skeleton } from '../../../design-system/Feedback';
import { ease } from '../../../design-system/motion/variants';
import { useTilt } from '../../../design-system/motion/useTilt';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useI18n } from '../../../shared/i18n';
import { adminApi, listAll } from '../admin.api';
import '../admin.css';

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

function useRelativeTime() {
  const { language } = useI18n();
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  return (date) => {
    const seconds = (new Date(date).getTime() - Date.now()) / 1000;
    const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) || ['minute', 60];
    return format.format(Math.round(seconds / size), unit);
  };
}

function Kpi({ icon, value, label, hint, to, index }) {
  const tilt = useTilt(4);
  const content = (
    <>
      <span className="kpi-icon">
        <Icon name={icon} size={18} />
      </span>
      <strong>
        <CountUp value={value} duration={1.2} />
      </strong>
      <span>{label}</span>
      {hint && <small className="muted">{hint}</small>}
    </>
  );
  return (
    <GlassView
      as={motion.div}
      isInteractive={Boolean(to)}
      className="kpi"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: 0.2 + index * 0.07 }}
      whileHover={to ? { y: -3 } : undefined}
      {...(to ? tilt : {})}
    >
      {to ? <Link to={to} className="kpi-link">{content}</Link> : content}
    </GlassView>
  );
}

/** Admin start page: four numbers, completion per course and who signed in recently. */
export default function OverviewPage() {
  const { t, apiMessage } = useI18n();
  const relative = useRelativeTime();
  const { data, error, reload } = useAsync(async (signal) => {
    const [users, completion] = await Promise.all([listAll('users', undefined, signal), adminApi.report('course-completion', signal)]);
    return { users, completion };
  }, []);

  if (error && !data) return <ErrorAlert onRetry={reload} retryLabel={t('actions.retry')}>{apiMessage(error.message)}</ErrorAlert>;

  const users = data?.users || [];
  const completion = data?.completion || [];
  const students = users.filter((u) => u.role === 'student' && u.status === 'active').length;
  const maxCompletions = Math.max(1, ...completion.map((c) => c.completions));
  const recent = users
    .filter((u) => u.last_login_at)
    .sort((a, b) => new Date(b.last_login_at) - new Date(a.last_login_at))
    .slice(0, 5);

  const kpis = [
    ['users', data && users.length, t('overview.kpiUsers'), t('overview.kpiUsersHint', { count: students }), '/admin/users'],
    ['book', data && completion.length, t('overview.kpiCourses'), null, '/admin/courses'],
    ['video', data && completion.reduce((s, c) => s + c.total_contents, 0), t('overview.kpiLessons'), null, '/admin/contents'],
    ['checkCircle', data && completion.reduce((s, c) => s + c.completions, 0), t('overview.kpiCompletions'), null, null],
  ];

  return (
    <div className="overview">
      <header className="page-header">
        <div>
          <TextReveal text={t('overview.title')} />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Accent text={t('overview.subtitle')} />
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Link to="/admin/reports" className="btn">
            <Icon name="chart" size={16} /> {t('overview.seeReports')}
          </Link>
        </motion.div>
      </header>

      <div className="kpis">
        {kpis.map(([icon, value, label, hint, to], i) => (
          <Kpi key={label} icon={icon} value={value || value === 0 ? value : null} label={label} hint={hint} to={to} index={i} />
        ))}
      </div>

      <div className="overview-grid">
        <Reveal as="section" className="glass panel" delay={0.35}>
          <header className="panel-title">
            <h2>{t('overview.completionTitle')}</h2>
            <p className="muted small">{t('overview.completionDesc')}</p>
          </header>
          {!data ? (
            <div className="stack">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={34} />)}</div>
          ) : (
            <ol className="completion-list">
              {completion.map((c, i) => (
                <li key={c.id}>
                  <div className="completion-row">
                    <Link to={`/admin/courses/${c.id}`} className="strong-link">{c.title}</Link>
                    <span className="muted small">{t('overview.completions', { count: c.completions })}, {t('overview.learners', { count: c.learners })}</span>
                  </div>
                  <div className="completion-track">
                    <motion.span
                      className="completion-bar"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: c.completions / maxCompletions }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease, delay: 0.45 + i * 0.08 }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Reveal>

        <Reveal as="section" className="glass panel" delay={0.45}>
          <header className="panel-title">
            <h2>{t('overview.activityTitle')}</h2>
            <p className="muted small">{t('overview.activityDesc')}</p>
          </header>
          {!data ? (
            <div className="stack">{[0, 1, 2].map((i) => <Skeleton key={i} height={40} />)}</div>
          ) : recent.length === 0 ? (
            <EmptyState icon="users">{t('overview.noActivity')}</EmptyState>
          ) : (
            <ul className="activity-list">
              {recent.map((u, i) => (
                <motion.li
                  key={u.id}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease, delay: 0.5 + i * 0.06 }}
                >
                  <Avatar name={u.name} />
                  <span className="activity-who">
                    <strong>{u.name}</strong>
                    <small>{t('overview.lessonsDone', { count: u.completed_lessons })}</small>
                  </span>
                  <span className="activity-when muted small">{relative(u.last_login_at)}</span>
                </motion.li>
              ))}
            </ul>
          )}
          <Link to="/admin/users" className="btn btn-ghost btn-sm panel-more">
            {t('overview.allUsers')} <Icon name="chevronRight" size={14} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
