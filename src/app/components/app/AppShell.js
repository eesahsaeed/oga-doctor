import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelect from '../shared/LanguageSelect';
import { getAuthRoute, isDoctorUser } from '../../lib/account';

function linkClassName({ isActive }) {
  return [
    'whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
    isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');
}

export default function AppShell() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tr } = useLanguage();
  const isDoctor = isDoctorUser(user);
  const navItems = isDoctor
    ? [
        { to: '/app/dashboard', label: 'Dashboard' },
        { to: '/app/consultation/messages', label: 'Patient Messages' },
        { to: '/app/consultation/video', label: 'Video Visit' },
        { to: '/app/profile', label: 'Profile' },
      ]
    : [
        { to: '/app/dashboard', label: 'Dashboard' },
        { to: '/app/consultation/doctors', label: 'Doctors' },
        { to: '/app/consultation/specialists', label: 'Specialists' },
        { to: '/app/consultation/messages', label: 'Doctor Messages' },
        { to: '/app/consultation/chat', label: 'AI Chat' },
        { to: '/app/consultation/video', label: 'Video Visit' },
        { to: '/app/schedule', label: 'Schedule' },
        { to: '/app/notifications', label: 'Notifications' },
        { to: '/app/reports', label: 'Reports' },
        { to: '/app/profile', label: 'Profile' },
      ];

  const onSignOut = () => {
    const nextRoute = getAuthRoute(user?.accountType, 'signin');
    signOut();
    navigate(nextRoute, { replace: true });
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
                {user?.name || tr(isDoctor ? 'Doctor' : 'Patient')} -{' '}
                {user?.email || tr('Signed in')}
              </p>
            </button>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <LanguageSelect
                showLabel={false}
                selectClassName="min-w-[120px]"
              />
              <button
                type="button"
                onClick={onSignOut}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:w-auto"
              >
                {tr('Sign Out')}
              </button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClassName}>
                {tr(item.label)}
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
