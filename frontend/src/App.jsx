import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import ResourcePage from './pages/ResourcePage';
import CourseDetail from './pages/CourseDetail';
import ContentDetail from './pages/ContentDetail';
import Reports from './pages/Reports';
import DemoBanner from './components/DemoBanner';
import { DEMO } from './api/client';

const docsUrl = DEMO ? `${import.meta.env.BASE_URL}swagger/` : '/api/docs';

const links = [
  ['/reports', 'Reports'],
  ['/courses', 'Courses'],
  ['/modules', 'Modules'],
  ['/contents', 'Contents'],
  ['/users', 'Users'],
];

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="28" height="28" />
          Course Manager
        </div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
        <a className="docs-link" href={docsUrl} target="_blank" rel="noreferrer">API docs (Swagger) ↗</a>
      </aside>
      <main className="content">
        {DEMO && <DemoBanner />}
        <Routes>
          <Route path="/" element={<Navigate to="/reports" replace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<ResourcePage key="users" name="users" />} />
          <Route path="/courses" element={<ResourcePage key="courses" name="courses" />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/modules" element={<ResourcePage key="modules" name="modules" />} />
          <Route path="/contents" element={<ResourcePage key="contents" name="contents" />} />
          <Route path="/contents/:id" element={<ContentDetail />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}
