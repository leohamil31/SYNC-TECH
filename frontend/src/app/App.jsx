import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import AppShell from '../shell/AppShell';
import BrandSplash from '../design-system/brand/BrandSplash';
import AmbientBackground from '../design-system/AmbientBackground';
import { EmptyState } from '../design-system/Feedback';
import { useI18n } from '../shared/i18n';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import HomePage from '../features/learner/pages/HomePage';
import CatalogPage from '../features/learner/pages/CatalogPage';
import CoursePage from '../features/learner/pages/CoursePage';
import LessonPage from '../features/learner/pages/LessonPage';
import { GuestOnly, HomeRedirect, RequireAuth, RequireRole } from './guards';

// The admin panel is only downloaded by admins.
const OverviewPage = lazy(() => import('../features/admin/pages/OverviewPage'));
const ResourcePage = lazy(() => import('../features/admin/pages/ResourcePage'));
const CourseDetailPage = lazy(() => import('../features/admin/pages/CourseDetailPage'));
const ContentDetailPage = lazy(() => import('../features/admin/pages/ContentDetailPage'));
const ReportsPage = lazy(() => import('../features/admin/pages/ReportsPage'));

function NotFound() {
  const { t } = useI18n();
  return (
    <EmptyState icon="compass" title={t('common.notFound')} action={<Link to="/" className="btn btn-primary">{t('common.goHome')}</Link>}>
      {t('common.notFoundHint')}
    </EmptyState>
  );
}

const admin = (element) => <Suspense fallback={<span className="skeleton" style={{ height: 36, width: '40%' }} />}>{element}</Suspense>;

/**
 * Route map
 *   /login, /register                 guests only
 *   /app/**                           any signed-in user (learner area)
 *   /admin/**                         admins only (management area)
 */
export default function App() {
  return (
    <>
      <AmbientBackground />
      <BrandSplash />
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route index element={<HomeRedirect />} />

          <Route path="/app" element={<AppShell area="learner" />}>
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="courses/:id" element={<CoursePage />} />
            <Route path="lessons/:id" element={<LessonPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<RequireRole role="admin" />}>
            <Route path="/admin" element={<AppShell area="admin" />}>
              <Route index element={admin(<OverviewPage />)} />
              <Route path="users" element={admin(<ResourcePage key="users" name="users" />)} />
              <Route path="courses" element={admin(<ResourcePage key="courses" name="courses" />)} />
              <Route path="courses/:id" element={admin(<CourseDetailPage />)} />
              <Route path="modules" element={admin(<ResourcePage key="modules" name="modules" />)} />
              <Route path="contents" element={admin(<ResourcePage key="contents" name="contents" />)} />
              <Route path="contents/:id" element={admin(<ContentDetailPage />)} />
              <Route path="reports" element={admin(<ReportsPage />)} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Routes>
    </>
  );
}
