import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import ResourcePage from './pages/ResourcePage';
import CourseDetail from './pages/CourseDetail';
import ContentDetail from './pages/ContentDetail';
import Reports from './pages/Reports';
import DemoBanner from './components/DemoBanner';
import Icon from './components/Icon';
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
            {l.short}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        title={`${t('settings.theme')}: ${theme === 'dark' ? t('settings.dark') : t('settings.light')}`}
        aria-label={t('settings.theme')}
      >
        <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={16} />
      </button>
    </div>
  );
}

export default function App() {
  const { t } = useI18n();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="32" height="32" />
          <div>
            <strong>{t('app.name')}</strong>
            <span>{t('app.tagline')}</span>
          </div>
        </div>
        <nav className="nav">
          {sections.map((section) => (
            <div key={section.title} className="nav-section">
              <span className="nav-title">{t(section.title)}</span>
              {section.links.map(([to, label, icon]) => (
                <NavLink key={to} to={to}>
                  <Icon name={icon} size={18} />
                  <span>{t(label)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a className="docs-link" href={docsUrl} target="_blank" rel="noreferrer">
            <Icon name="code" size={16} /> {t('nav.apiDocs')} <Icon name="external" size={13} />
          </a>
          <Preferences />
        </div>
      </aside>
      <main className="content">
        {DEMO && <DemoBanner />}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Reports />} />
          <Route path="/users" element={<ResourcePage key="users" name="users" />} />
          <Route path="/courses" element={<ResourcePage key="courses" name="courses" />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/modules" element={<ResourcePage key="modules" name="modules" />} />
          <Route path="/contents" element={<ResourcePage key="contents" name="contents" />} />
          <Route path="/contents/:id" element={<ContentDetail />} />
          <Route path="*" element={<p className="muted">{t('common.notFound')}</p>} />
        </Routes>
      </main>
    </div>
  );
}
