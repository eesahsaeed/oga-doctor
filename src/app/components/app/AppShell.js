import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/schedule', label: 'Schedule' },
  { to: '/app/notifications', label: 'Notifications' },
  { to: '/app/reports', label: 'Reports' },
  { to: '/app/consultation/chat', label: 'AI Chat' },
  { to: '/app/consultation/video', label: 'Video Visit' },
  { to: '/app/profile', label: 'Profile' },
];

function linkClassName({ isActive }) {
  return [
    'px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
    isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');
}

export default function AppShell() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const onSignOut = () => {
    signOut();
    navigate('/auth/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              type="button"
              onClick={() => navigate('/app/dashboard')}
              className="text-left"
            >
              <p className="text-xl font-bold text-slate-900">OgaDoctor Care</p>
              <p className="text-xs text-slate-500">
                {user?.name || 'Patient'} � {user?.email || 'Signed in'}
              </p>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sign Out
            </button>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
