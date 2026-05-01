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
    'whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
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
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate('/app/dashboard')}
              className="min-w-0 text-left"
            >
              <p className="text-lg font-bold text-slate-900 sm:text-xl">
                OgaDoctor Care
              </p>
              <p className="max-w-[88vw] truncate text-xs text-slate-500 sm:max-w-none">
                {user?.name || 'Patient'} - {user?.email || 'Signed in'}
              </p>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              Sign Out
            </button>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
