import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelect from '../shared/LanguageSelect';
import { getAuthRoute, isDoctorUser } from '../../lib/account';

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.75v-6h-4.5v6H5a1 1 0 0 1-1-1v-9.5Z"
      />
    </svg>
  );
}

function DoctorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.25 4.75a2.5 2.5 0 0 1 2.5 2.5v3a2.75 2.75 0 0 1-5.5 0v-3a2.5 2.5 0 0 1 2.5-2.5Zm9.5 0a2.5 2.5 0 0 1 2.5 2.5v3a2.75 2.75 0 0 1-5.5 0v-3a2.5 2.5 0 0 1 2.5-2.5ZM7.25 13c0 3.2 2.35 5.82 5.25 6.27V21m4.25-8c0 3.2-2.35 5.82-5.25 6.27M12 8.5v12"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.25 20.5h5.5" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 18.25 3.75 20V6.75A1.75 1.75 0 0 1 5.5 5h13A1.75 1.75 0 0 1 20.25 6.75v8.5A1.75 1.75 0 0 1 18.5 17H7Z"
      />
      <path strokeLinecap="round" d="M8 9h8M8 13h5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 3 1.55 4.7L18 9.25l-4.45 1.55L12 15.5l-1.55-4.7L6 9.25l4.45-1.55L12 3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m18.5 14 .78 2.22 2.22.78-2.22.78-.78 2.22-.78-2.22-2.22-.78 2.22-.78.78-2.22ZM5.5 13l.94 2.56L9 16.5l-2.56.94L5.5 20l-.94-2.56L2 16.5l2.56-.94L5.5 13Z"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3.75" y="6.25" width="11.5" height="11.5" rx="2.25" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15.25 10.1 4.5-2.4v8.6l-4.5-2.4"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path
        strokeLinecap="round"
        d="M8 3.75v3.5M16 3.75v3.5M4 9.5h16M8 13h3M8 16.5h6"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 18.25h7l-1-1.85v-4.15a3.5 3.5 0 1 0-7 0v4.15l-1 1.85Z"
      />
      <path strokeLinecap="round" d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3.75h7l4.25 4.25V19.5A1.75 1.75 0 0 1 16.5 21h-9A1.75 1.75 0 0 1 5.75 19.5v-14A1.75 1.75 0 0 1 7.5 3.75Z"
      />
      <path
        strokeLinecap="round"
        d="M14 3.75V8h4.25M8.75 12h6.5M8.75 15.5h6.5"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8.25" r="3.25" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.75 19.25a6.25 6.25 0 0 1 12.5 0"
      />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6.75A1.75 1.75 0 0 0 5 7.75v8.5C5 17.22 5.78 18 6.75 18H10"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m13 8 4 4-4 4M17 12H9"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path
        strokeLinecap="round"
        d="M3.75 12h16.5M12 3.75c2.5 2.25 4 5.2 4 8.25s-1.5 6-4 8.25c-2.5-2.25-4-5.2-4-8.25s1.5-6 4-8.25Z"
      />
    </svg>
  );
}

function ChevronDownIcon({ open = false }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

function HamburgerIcon({ open = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {open ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m6 6 12 12M18 6 6 18"
        />
      ) : (
        <>
          <path strokeLinecap="round" d="M4.5 7.25h15" />
          <path strokeLinecap="round" d="M4.5 12h15" />
          <path strokeLinecap="round" d="M4.5 16.75h15" />
        </>
      )}
    </svg>
  );
}

function navIcon(label) {
  switch (label) {
    case 'Doctors':
      return <DoctorIcon />;
    case 'Doctor Messages':
    case 'Patient Messages':
      return <MessageIcon />;
    case 'AI Chat':
      return <SparkIcon />;
    case 'Video Visit':
      return <VideoIcon />;
    case 'Schedule':
      return <CalendarIcon />;
    case 'Notifications':
      return <BellIcon />;
    case 'Reports':
      return <ReportsIcon />;
    case 'Profile':
      return <ProfileIcon />;
    default:
      return <HomeIcon />;
  }
}

function InlineNavItem({ to, label, tr }) {
  return (
    <NavLink
      to={to}
      title={tr(label)}
      aria-label={tr(label)}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-0 rounded-2xl border px-0 transition-all sm:w-auto sm:justify-start sm:gap-2 sm:px-3"
      style={({ isActive }) => ({
        borderColor: isActive ? '#0f172a' : '#dbe5f0',
        backgroundColor: isActive ? '#0f172a' : '#ffffff',
        color: isActive ? '#ffffff' : '#334155',
        boxShadow: isActive ? '0 10px 20px rgba(15, 23, 42, 0.16)' : 'none',
      })}
    >
      <span aria-hidden="true">{navIcon(label)}</span>
      <span className="hidden whitespace-nowrap text-xs font-semibold sm:inline sm:text-sm">
        {tr(label)}
      </span>
    </NavLink>
  );
}

function getInitials(name = '', email = '') {
  const source = String(name || email || 'Oga Doctor').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'OD';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function getAvatarSource(user = {}) {
  const candidates = [
    user?.avatar,
    user?.profile?.avatar,
    user?.profile?.image,
    user?.profile?.imageUrl,
    user?.profile?.photo,
    user?.profile?.photoUrl,
  ];

  return (
    candidates.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    ) || ''
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { tr } = useLanguage();
  const isDoctor = isDoctorUser(user);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const navItems = isDoctor
    ? [
        { to: '/app/consultation/messages', label: 'Patient Messages' },
        { to: '/app/consultation/video', label: 'Video Visit' },
      ]
    : [
        { to: '/app/consultation/doctors', label: 'Doctors' },
        { to: '/app/consultation/messages', label: 'Doctor Messages' },
        { to: '/app/consultation/chat', label: 'AI Chat' },
        { to: '/app/consultation/video', label: 'Video Visit' },
        { to: '/app/schedule', label: 'Schedule' },
      ];
  const accountItems = isDoctor
    ? [{ to: '/app/profile', label: 'Profile', icon: <ProfileIcon /> }]
    : [
        {
          to: '/app/notifications',
          label: 'Notifications',
          icon: <BellIcon />,
        },
        { to: '/app/reports', label: 'Reports', icon: <ReportsIcon /> },
        { to: '/app/profile', label: 'Profile', icon: <ProfileIcon /> },
      ];
  const avatarSrc = useMemo(() => getAvatarSource(user), [user]);
  const avatarInitials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.email, user?.name],
  );
  const accountLabel = tr('Account');
  const shortUserName = useMemo(() => {
    const source = String(user?.name || user?.email || tr('Profile')).trim();
    return source.split(/\s+/)[0] || source;
  }, [tr, user?.email, user?.name]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const onSignOut = () => {
    const nextRoute = getAuthRoute(user?.accountType, 'signin');
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    signOut();
    navigate(nextRoute, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/app/dashboard')}
              title={tr('Dashboard')}
              aria-label={tr('Dashboard')}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <img
                src="/image/ogaDoctor.png"
                alt={tr('OgaDoctor')}
                className="h-9 w-9 rounded-2xl bg-white object-contain p-1"
              />
            </button>

            <div className="hidden min-w-0 flex-1 overflow-x-auto md:block">
              <nav className="flex min-w-max items-center gap-2">
                {navItems.map((item) => (
                  <InlineNavItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    tr={tr}
                  />
                ))}
              </nav>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <LanguageSelect
                variant="menu"
                labelMode="code"
                showLabel
                iconOnlyOnMobile
                mobileIcon={<GlobeIcon />}
                className="hidden shrink-0 gap-1.5 md:inline-flex"
                labelClassName="whitespace-nowrap text-xs font-semibold text-slate-600"
                buttonClassName="min-w-0 w-11 justify-center gap-1 rounded-2xl border-slate-200 bg-white px-0 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 sm:w-[76px] sm:px-2.5"
                menuClassName="border-slate-200"
              />

              <div ref={accountMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  title={accountLabel}
                  aria-label={accountLabel}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white pl-1.5 pr-2.5 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  style={{
                    color: '#334155',
                    borderColor: '#dbe5f0',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={tr('User avatar')}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {avatarInitials}
                    </span>
                  )}
                  <span className="hidden whitespace-nowrap text-xs font-semibold sm:inline sm:text-sm">
                    {shortUserName}
                  </span>
                  <ChevronDownIcon open={accountMenuOpen} />
                </button>

                {accountMenuOpen && (
                  <div
                    role="menu"
                    aria-label={accountLabel}
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[260px] rounded-3xl border border-slate-200 bg-white p-3 shadow-xl"
                    style={{
                      borderColor: '#dbe5f0',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {accountLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {user?.name || tr('User')}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {user?.email || tr('No email available')}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {accountItems.map((item) => (
                        <button
                          key={item.to}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate(item.to);
                          }}
                          className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {item.icon}
                          <span>{tr(item.label)}</span>
                        </button>
                      ))}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={onSignOut}
                        className="flex w-full items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-rose-50"
                        style={{
                          color: '#b91c1c',
                          borderColor: '#fca5a5',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <SignOutIcon />
                        <span>{tr('Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label={mobileMenuOpen ? tr('Close menu') : tr('Open menu')}
                aria-expanded={mobileMenuOpen}
                aria-controls="app-mobile-dashboard-menu"
                onClick={() => {
                  setAccountMenuOpen(false);
                  setMobileMenuOpen((prev) => !prev);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:hidden"
                style={{
                  color: '#334155',
                  borderColor: '#dbe5f0',
                  backgroundColor: '#ffffff',
                }}
              >
                <HamburgerIcon open={mobileMenuOpen} />
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div
              id="app-mobile-dashboard-menu"
              className="mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:hidden"
              style={{
                borderColor: '#dbe5f0',
                backgroundColor: '#ffffff',
              }}
            >
              <div className="space-y-3">
                <div>
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {tr('Navigation')}
                  </p>
                  <div className="mt-2 space-y-2">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition"
                        style={({ isActive }) => ({
                          borderColor: isActive ? '#0f172a' : '#dbe5f0',
                          backgroundColor: isActive ? '#0f172a' : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                        })}
                      >
                        <span aria-hidden="true">{navIcon(item.label)}</span>
                        <span>{tr(item.label)}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {tr('Language')}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {tr(
                          'Choose the language you want to use across your dashboard.',
                        )}
                      </p>
                    </div>
                    <LanguageSelect
                      variant="menu"
                      labelMode="code"
                      showLabel={false}
                      className="shrink-0"
                      buttonClassName="min-w-[76px] justify-between rounded-2xl border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
                      menuClassName="border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-4 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
