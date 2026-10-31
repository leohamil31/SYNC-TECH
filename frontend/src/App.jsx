import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import ResourcePage from './pages/ResourcePage';
import CourseDetail from './pages/CourseDetail';
import ContentDetail from './pages/ContentDetail';
import Reports from './pages/Reports';
import DemoBanner from './components/DemoBanner';
import BrandSplash from './components/brand/BrandSplash';
import Icon from './components/Icon';
import PageTransition from './components/motion/PageTransition';
import { spring } from './components/motion/variants';
import { DEMO } from './api/client';
import { LANGUAGES, useI18n } from './i18n';
import { useTheme } from './hooks/useTheme';

const docsUrl = DEMO ? `${import.meta.env.BASE_URL}swagger/` : '/api/docs';

const sections = [
  { title: 'nav.main', links: [['/dashboard', 'nav.dashboard', 'dashboard']] },
  {
    title: 'nav.manage',
    links: [
      ['/courses', 'nav.courses', 'book'],
      ['/modules', 'nav.modules', 'layers'],
      ['/contents', 'nav.contents', 'file'],
      ['/users', 'nav.users', 'users'],
    ],
  },
];

function Preferences() {
  const { t, language, setLanguage } = useI18n();
  const [theme, toggleTheme] = useTheme();

  // Cross-fade the whole UI when the browser supports View Transitions.
  const switchTheme = () => {
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(toggleTheme);
    } else toggleTheme();
  };

  return (
    <div className="preferences">
      <div className="segmented" role="group" aria-label={t('settings.language')}>
        <Icon name="globe" size={15} />
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            className={language === l.code ? 'active' : undefined}
            aria-pressed={language === l.code}
            title={l.label}
            onClick={() => setLanguage(l.code)}
          >
            {language === l.code && <motion.span layoutId="lang-thumb" className="segmented-thumb" transition={spring} />}
            <span>{l.short}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={switchTheme}
        title={`${t('settings.theme')}: ${theme === 'dark' ? t('settings.dark') : t('settings.light')}`}
        aria-label={t('settings.theme')}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            style={{ display: 'grid' }}
            initial={{ y: 14, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -14, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={16} />
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}

const page = (el) => <PageTransition>{el}</PageTransition>;

export default function App() {
  const { t } = useI18n();
  const location = useLocation();
  // Detail pages share a transition key with nothing else; list pages key on pathname.
  const routeKey = location.pathname;

  return (
    <div className="layout">
      <BrandSplash />
      <div className="ambient" aria-hidden="true"><span /><span /><span /></div>
      <aside className="sidebar">
        <div className="brand">
          <div>
            <strong>Sync<b>Tech</b></strong>
            <span>{t('app.name')}</span>
          </div>
        </div>
        <LayoutGroup id="nav">
          <nav className="nav">
            {sections.map((section) => (
              <div key={section.title} className="nav-section">
                <span className="nav-title">{t(section.title)}</span>
                {section.links.map(([to, label, icon]) => (
                  <NavLink key={to} to={to}>
                    {({ isActive }) => (
                      <>
                        {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={spring} />}
                        <Icon name={icon} size={18} />
                        <span>{t(label)}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </LayoutGroup>
        <div className="sidebar-footer">
          <a className="docs-link" href={docsUrl} target="_blank" rel="noreferrer">
            <Icon name="code" size={16} /> {t('nav.apiDocs')} <Icon name="external" size={13} />
          </a>
          <Preferences />
        </div>
      </aside>
      <main className="content">
        {DEMO && <DemoBanner />}
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={routeKey}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={page(<Reports />)} />
            <Route path="/users" element={page(<ResourcePage key="users" name="users" />)} />
            <Route path="/courses" element={page(<ResourcePage key="courses" name="courses" />)} />
            <Route path="/courses/:id" element={page(<CourseDetail />)} />
            <Route path="/modules" element={page(<ResourcePage key="modules" name="modules" />)} />
            <Route path="/contents" element={page(<ResourcePage key="contents" name="contents" />)} />
            <Route path="/contents/:id" element={page(<ContentDetail />)} />
            <Route path="*" element={page(<p className="muted">{t('common.notFound')}</p>)} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
