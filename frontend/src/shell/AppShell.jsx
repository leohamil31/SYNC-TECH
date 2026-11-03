import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import GlassView from '../design-system/GlassView';
import Avatar from '../design-system/Avatar';
import Icon from '../design-system/Icon';
import PageTransition from '../design-system/motion/PageTransition';
import { spring } from '../design-system/motion/variants';
import { useAuth } from '../features/auth/AuthProvider';
import { useI18n } from '../shared/i18n';
import LanguageSwitch from './LanguageSwitch';
import { NAVIGATION } from './navigation';
import './shell.css';

function Brand() {
  return (
    <Link to="/" className="brand-link" aria-label="SyncTech">
      <span className="brand-mark" aria-hidden="true">S</span>
      <span className="brand-name">
        Sync<b>Tech</b>
      </span>
    </Link>
  );
}

/** Lets admins jump between their learner view and the admin panel. */
function AreaSwitch({ area }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="area-switch">
      <div className="segmented" role="tablist" aria-label={t('nav.area')}>
        {[
          ['learner', '/app', 'nav.learnerArea'],
          ['admin', '/admin', 'nav.adminArea'],
        ].map(([key, to, label]) => (
          <button key={key} type="button" role="tab" aria-selected={area === key} onClick={() => navigate(to)}>
            {area === key && <motion.span layoutId="area-thumb" className="segmented-thumb" transition={spring} />}
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function NavItems({ items, pillId, compact = false }) {
  const { t } = useI18n();
  return items.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.end}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId={pillId} className="nav-pill" transition={spring} />}
          <Icon name={item.icon} size={compact ? 20 : 18} />
          <span>{t(item.label)}</span>
        </>
      )}
    </NavLink>
  ));
}

/**
 * Responsive application frame shared by the learner and admin areas.
 * Desktop: glass sidebar. Phones/tablets: glass top bar + floating glass tab bar.
 */
export default function AppShell({ area }) {
  const { t } = useI18n();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();
  const items = NAVIGATION[area];

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        {t('nav.skip')}
      </a>

      <GlassView as="aside" className="sidebar" aria-label={t('nav.main')}>
        <Brand />
        {isAdmin && <AreaSwitch area={area} />}
        <LayoutGroup id="sidebar-nav">
          <nav className="nav">
            <NavItems items={items} pillId="sidebar-pill" />
          </nav>
        </LayoutGroup>
        <div className="sidebar-footer">
          <LanguageSwitch layoutId="lang-sidebar" />
          <GlassView glassEffectStyle="clear" className="user-card">
            <Avatar name={user.name} />
            <div>
              <strong>{user.name}</strong>
              <small>{t(`roles.${user.role}`)}</small>
            </div>
            <button type="button" className="icon-btn" onClick={logout} aria-label={t('auth.signOut')} title={t('auth.signOut')}>
              <Icon name="logout" size={16} />
            </button>
          </GlassView>
        </div>
      </GlassView>

      <GlassView as="header" className="topbar">
        <Brand />
        <div className="row">
          {isAdmin && (
            <Link className="btn btn-sm" to={area === 'admin' ? '/app' : '/admin'}>
              <Icon name={area === 'admin' ? 'book' : 'shield'} size={14} />
              {t(area === 'admin' ? 'nav.learnerArea' : 'nav.adminArea')}
            </Link>
          )}
          <button type="button" className="icon-btn" onClick={logout} aria-label={t('auth.signOut')}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </GlassView>

      <main id="main" className="main">
        <div className="main-inner">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>{outlet}</PageTransition>
          </AnimatePresence>
        </div>
      </main>

      <LayoutGroup id="tab-nav">
        <GlassView as="nav" className="tabbar" aria-label={t('nav.main')}>
          <NavItems items={items.filter((item) => item.tabbar !== false)} pillId="tab-pill" compact />
        </GlassView>
      </LayoutGroup>
    </div>
  );
}
