import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { useI18n } from '../shared/i18n';

function SessionCheck() {
  const { t } = useI18n();
  return (
    <div className="session-check" aria-busy="true">
      <span className="brand-mark">S</span>
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

/** Renders child routes only for signed-in users; otherwise sends them to /login and back afterwards. */
export function RequireAuth() {
  const { status, signedOut } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <SessionCheck />;
  // Expired session: come back here after signing in. Explicit sign-out: start fresh.
  if (status === 'anonymous') return <Navigate to="/login" replace state={signedOut ? undefined : { from: location }} />;
  return <Outlet />;
}

/** Renders child routes only for the given role. Students who reach /admin go to their own area. */
export function RequireRole({ role }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to="/app" replace />;
  return <Outlet />;
}

/** Login/register pages: already signed-in users go straight to their area. */
export function GuestOnly() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <SessionCheck />;
  if (status === 'authenticated') {
    const target = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/app');
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}

export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/app'} replace />;
}
