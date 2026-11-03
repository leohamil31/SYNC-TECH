/**
 * Navigation per area. `end` makes the index link active only on its exact path;
 * `tabbar: false` keeps an item out of the phone tab bar (it stays in the sidebar).
 */
export const NAVIGATION = {
  learner: [
    { to: '/app', label: 'nav.home', icon: 'home', end: true },
    { to: '/app/catalog', label: 'nav.catalog', icon: 'compass' },
  ],
  admin: [
    { to: '/admin', label: 'nav.overview', icon: 'dashboard', end: true },
    { to: '/admin/courses', label: 'nav.courses', icon: 'book' },
    { to: '/admin/modules', label: 'nav.modules', icon: 'layers', tabbar: false },
    { to: '/admin/contents', label: 'nav.lessons', icon: 'video' },
    { to: '/admin/users', label: 'nav.users', icon: 'users' },
    { to: '/admin/reports', label: 'nav.reports', icon: 'chart', tabbar: false },
  ],
};
