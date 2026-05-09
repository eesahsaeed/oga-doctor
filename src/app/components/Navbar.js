import React from 'react';
import { createPortal } from 'react-dom';
import {
  Navbar as MTNavbar,
  Collapse,
  Typography,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
} from '@material-tailwind/react';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  EnvelopeIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../lib/api';
import LanguageSelect from './shared/LanguageSelect';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
  { to: '/blog', label: 'Blog' },
];

const CLEAR_DB_CONFIRMATION = 'CLEAR OGADOCTOR DATA';

function DesktopNavLink({ to, label, isLightMode }) {
  const navBase = isLightMode
    ? 'text-gray-900 hover:text-blue-700'
    : 'text-white hover:text-blue-100';
  const navActive = isLightMode ? 'text-blue-700' : 'text-blue-200';

  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `text-sm font-medium transition-colors ${isActive ? navActive : navBase}`
        }
      >
        {label}
      </NavLink>
    </li>
  );
}

function MobileNavLink({ to, label, onNavigate }) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `block text-sm font-medium transition-colors ${isActive ? 'text-blue-700' : 'text-blue-gray-900 hover:text-blue-700'}`
        }
      >
        {label}
      </NavLink>
    </li>
  );
}

function ClearDatabaseStatus({ feedback, tr }) {
  if (!feedback) {
    return null;
  }

  const toneClasses =
    feedback.tone === 'error'
      ? 'border-red-300 bg-red-50 text-red-700'
      : feedback.tone === 'success'
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
        : 'border-amber-300 bg-amber-50 text-amber-700';

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}
      style={{
        color:
          feedback.tone === 'error'
            ? '#b91c1c'
            : feedback.tone === 'success'
              ? '#047857'
              : '#b45309',
        borderColor:
          feedback.tone === 'error'
            ? '#fca5a5'
            : feedback.tone === 'success'
              ? '#6ee7b7'
              : '#fcd34d',
        backgroundColor:
          feedback.tone === 'error'
            ? '#fef2f2'
            : feedback.tone === 'success'
              ? '#ecfdf5'
              : '#fffbeb',
      }}
    >
      <p className="font-medium" style={{ color: 'inherit' }}>
        {feedback.message}
      </p>
      {feedback.tone === 'loading' && (
        <p className="mt-1 text-xs opacity-80" style={{ color: 'inherit' }}>
          {tr('Please wait while records are being removed.')}
        </p>
      )}
    </div>
  );
}

function ClearDatabaseResult({ result, tr }) {
  if (!result) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm text-emerald-800"
      style={{
        color: '#065f46',
        borderColor: '#6ee7b7',
        backgroundColor: '#ecfdf5',
      }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold" style={{ color: '#065f46' }}>
          {tr('Environment')}: {result.environment || tr('unknown')}
        </span>
        <span className="font-semibold" style={{ color: '#065f46' }}>
          {tr('Production')}: {result.production ? tr('Yes') : tr('No')}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.entries(result.cleared || {}).map(([label, count]) => (
          <div
            key={label}
            className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2"
            style={{
              borderColor: '#a7f3d0',
              backgroundColor: 'rgba(255,255,255,0.86)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
              style={{ color: '#047857' }}
            >
              {label}
            </p>
            <p
              className="mt-1 text-base font-semibold text-emerald-900"
              style={{ color: '#064e3b' }}
            >
              {count}
            </p>
          </div>
        ))}
      </div>

      {result.note && (
        <p
          className="mt-3 text-xs leading-5 text-emerald-700"
          style={{ color: '#047857' }}
        >
          {result.note}
        </p>
      )}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [clearDatabaseModalOpen, setClearDatabaseModalOpen] =
    React.useState(false);
  const [clearingDatabase, setClearingDatabase] = React.useState(false);
  const [productionClearChecked, setProductionClearChecked] =
    React.useState(false);
  const [clearDatabaseConfirmation, setClearDatabaseConfirmation] =
    React.useState('');
  const [clearDatabaseFeedback, setClearDatabaseFeedback] =
    React.useState(null);
  const [clearDatabaseResult, setClearDatabaseResult] = React.useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const { tr } = useLanguage();

  const isHome = location.pathname === '/';
  const isLightMode = !isHome || isScrolling || open;
  const isLocalDevHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const showDatabaseClearButton =
    isHome &&
    (import.meta.env.DEV ||
      isLocalDevHost ||
      import.meta.env.VITE_ENABLE_DATABASE_CLEAR === 'true');

  function closeMobile() {
    setOpen(false);
  }

  function goToProtected(target) {
    navigate(isAuthenticated ? target : '/auth/signin');
    closeMobile();
  }

  function onSignOut() {
    signOut();
    setProfileOpen(false);
    closeMobile();
    navigate('/');
  }

  function resetClearDatabaseModalState() {
    setProductionClearChecked(false);
    setClearDatabaseConfirmation('');
    setClearDatabaseFeedback(null);
    setClearDatabaseResult(null);
  }

  function openClearDatabaseModal() {
    resetClearDatabaseModalState();
    setClearDatabaseModalOpen(true);
  }

  function closeClearDatabaseModal() {
    if (clearingDatabase) {
      return;
    }

    setClearDatabaseModalOpen(false);
    resetClearDatabaseModalState();
  }

  async function onClearDatabase() {
    if (!isAuthenticated) {
      setClearDatabaseFeedback({
        tone: 'error',
        message: tr('Sign in first to clear the app database.'),
      });
      return;
    }

    if (clearDatabaseConfirmation.trim() !== CLEAR_DB_CONFIRMATION) {
      setClearDatabaseFeedback({
        tone: 'error',
        message: tr('Confirmation phrase did not match.'),
      });
      return;
    }

    setClearingDatabase(true);
    setClearDatabaseFeedback({
      tone: 'loading',
      message: tr('Clearing the app database...'),
    });
    setClearDatabaseResult(null);

    try {
      const response = await apiClient.clearDevDatabase({
        confirmation: clearDatabaseConfirmation.trim(),
        production: productionClearChecked,
      });

      setProfileOpen(false);
      closeMobile();
      setClearDatabaseFeedback({
        tone: 'success',
        message: response?.message || tr('App database cleared.'),
      });
      setClearDatabaseResult(response || null);
    } catch (error) {
      setClearDatabaseFeedback({
        tone: 'error',
        message:
          error?.message || tr('Unable to clear the app database right now.'),
      });
    } finally {
      setClearingDatabase(false);
    }
  }

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 960) {
        setOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  React.useEffect(() => {
    function handleScroll() {
      setIsScrolling(window.scrollY > 0);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoClass = isLightMode ? 'brightness-100' : 'brightness-0 invert';
  const topBarIconButtonClass = `flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5 ${
    isLightMode
      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
  }`;

  const avatarText = user?.name || user?.email || 'Oga Doctor';
  const avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarText)}&background=2563eb&color=fff`;

  const clearDatabaseModal =
    clearDatabaseModalOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6"
            style={{ backgroundColor: 'rgba(2, 6, 23, 0.58)' }}
            onClick={closeClearDatabaseModal}
          >
            <div
              className="w-full max-w-xl rounded-[28px] border p-5 sm:p-6"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                color: '#0f172a',
                boxShadow:
                  '0 24px 64px rgba(15, 23, 42, 0.24), 0 8px 24px rgba(15, 23, 42, 0.12)',
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.28em] text-red-600"
                    style={{ color: '#dc2626' }}
                  >
                    {tr('Danger Zone')}
                  </p>
                  <h2
                    className="mt-2 text-2xl font-semibold text-slate-950"
                    style={{ color: '#020617' }}
                  >
                    {tr('Clear app database')}
                  </h2>
                  <p
                    className="mt-2 text-sm leading-6 text-slate-600"
                    style={{ color: '#475569' }}
                  >
                    {tr(
                      'This removes patients, doctors, chats, transcripts, and legacy records from the current backend connection.',
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeClearDatabaseModal}
                  disabled={clearingDatabase}
                  aria-label={tr('Close')}
                  className="rounded-full border p-2 transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-700"
                    style={{ color: '#334155' }}
                  >
                    {tr('Confirmation phrase')}
                  </span>
                  <input
                    type="text"
                    value={clearDatabaseConfirmation}
                    onChange={(event) => {
                      setClearDatabaseConfirmation(event.target.value);
                      setClearDatabaseFeedback(null);
                    }}
                    placeholder={CLEAR_DB_CONFIRMATION}
                    className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition"
                    style={{
                      borderColor: '#cbd5e1',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                    }}
                  />
                  <p
                    className="mt-2 text-xs text-slate-500"
                    style={{ color: '#64748b' }}
                  >
                    {tr('Type exactly:')}{' '}
                    <span
                      className="font-semibold text-slate-900"
                      style={{ color: '#0f172a' }}
                    >
                      {CLEAR_DB_CONFIRMATION}
                    </span>
                  </p>
                </label>

                <label
                  className="flex items-start gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: '#e2e8f0',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={productionClearChecked}
                    onChange={(event) => {
                      setProductionClearChecked(event.target.checked);
                      setClearDatabaseFeedback(null);
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-400"
                    style={{ accentColor: '#dc2626' }}
                  />
                  <span className="block">
                    <span
                      className="block text-sm font-semibold text-slate-900"
                      style={{ color: '#0f172a' }}
                    >
                      {tr('Also clear live / production database')}
                    </span>
                    <span
                      className="mt-1 block text-sm leading-6 text-slate-600"
                      style={{ color: '#475569' }}
                    >
                      {tr(
                        'Use this only when you intentionally want the live DynamoDB-backed app data wiped too.',
                      )}
                    </span>
                  </span>
                </label>

                <ClearDatabaseStatus feedback={clearDatabaseFeedback} tr={tr} />
                <ClearDatabaseResult result={clearDatabaseResult} tr={tr} />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeClearDatabaseModal}
                  disabled={clearingDatabase}
                  className="rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {clearDatabaseResult ? tr('Done') : tr('Cancel')}
                </button>

                {!clearDatabaseResult && (
                  <button
                    type="button"
                    onClick={() => void onClearDatabase()}
                    disabled={clearingDatabase}
                    className="rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: '#b91c1c',
                      color: '#ffffff',
                      backgroundColor: '#dc2626',
                    }}
                  >
                    {clearingDatabase ? tr('Clearing...') : tr('Clear DB')}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <MTNavbar
        fullWidth
        shadow={false}
        blurred={false}
        color={isLightMode ? 'white' : 'transparent'}
        className="fixed top-0 z-50 border-0 py-0 transition-colors duration-300"
      >
        <div className="container mx-auto flex items-center justify-between px-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center py-0" onClick={closeMobile}>
            <img
              src="/image/ogaDoctor.png"
              alt={tr('OgaDoctor')}
              className={`m-1 h-12 w-12 transition-all duration-300 sm:m-2 sm:h-16 sm:w-16 ${logoClass}`}
            />
          </Link>

          <ul className="ml-8 hidden items-center gap-6 lg:ml-12 lg:flex lg:gap-8">
            {navItems.map((item) => (
              <DesktopNavLink
                key={item.to}
                to={item.to}
                label={tr(item.label)}
                isLightMode={isLightMode}
              />
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            {showDatabaseClearButton && (
              <button
                type="button"
                onClick={openClearDatabaseModal}
                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                {tr('Clear DB')}
              </button>
            )}

            <LanguageSelect
              variant="menu"
              showLabel={false}
              className="text-slate-600"
              buttonClassName="min-w-[120px] border-slate-900 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50"
              menuClassName="border-slate-900"
            />

            <button
              type="button"
              onClick={() => goToProtected('/app/notifications')}
              aria-label={tr('Notifications')}
              className={topBarIconButtonClass}
            >
              <BellIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/messages');
                closeMobile();
              }}
              aria-label={tr('Messages')}
              className={topBarIconButtonClass}
            >
              <EnvelopeIcon className="h-5 w-5" />
            </button>

            {!isAuthenticated ? (
              <>
                <Link
                  to="/auth/signin"
                  className="rounded-xl border border-blue-gray-200 px-3 py-2 text-sm font-medium text-blue-gray-900 hover:bg-blue-gray-50"
                >
                  {tr('Sign In')}
                </Link>
                <Link
                  to="/auth/signup"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {tr('Sign Up')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/app/dashboard"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {tr('Dashboard')}
                </Link>

                <Menu
                  open={profileOpen}
                  handler={setProfileOpen}
                  placement="bottom-end"
                >
                  <MenuHandler>
                    <button className="flex items-center gap-1.5 rounded-full focus:outline-none">
                      <Avatar
                        variant="circular"
                        size="sm"
                        alt={tr('User Profile')}
                        src={avatarSrc}
                        className="cursor-pointer ring-2 ring-blue-500/30 ring-offset-2 transition-all hover:ring-blue-500/50"
                      />
                      <ChevronDownIcon
                        strokeWidth={2.5}
                        className={`h-4 w-4 transition-transform duration-200 ease-in-out ${
                          isLightMode ? 'text-gray-700' : 'text-white'
                        } ${profileOpen ? 'rotate-180' : 'rotate-0'}`}
                      />
                    </button>
                  </MenuHandler>

                  <MenuList className="min-w-[190px] rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl shadow-slate-200/60">
                    <MenuItem
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => {
                        navigate('/app/profile');
                        setProfileOpen(false);
                      }}
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      <Typography
                        variant="small"
                        className="font-medium !text-slate-700"
                      >
                        {tr('My Profile')}
                      </Typography>
                    </MenuItem>

                    <MenuItem
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => {
                        navigate('/app/profile');
                        setProfileOpen(false);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.737.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <Typography
                        variant="small"
                        className="font-medium !text-slate-700"
                      >
                        {tr('Settings')}
                      </Typography>
                    </MenuItem>

                    <hr className="my-2 border-blue-gray-50" />

                    <MenuItem
                      className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 focus:bg-red-100 focus:text-red-700"
                      onClick={onSignOut}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                        />
                      </svg>
                      <Typography
                        variant="small"
                        className="font-medium !text-red-600"
                      >
                        {tr('Sign Out')}
                      </Typography>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((cur) => !cur)}
            aria-label={open ? tr('Close menu') : tr('Open menu')}
            className={`ml-auto flex h-10 w-10 items-center justify-center rounded-full border transition lg:hidden ${
              isLightMode
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            {open ? (
              <XMarkIcon strokeWidth={2} className="h-7 w-7" />
            ) : (
              <Bars3Icon strokeWidth={2} className="h-7 w-7" />
            )}
          </button>
        </div>

        <Collapse open={open}>
          <div className="container mx-auto mt-2 border-t border-blue-gray-50 bg-white px-4 py-5 sm:px-6">
            <ul className="flex flex-col gap-5 text-blue-gray-900">
              {navItems.map((item) => (
                <MobileNavLink
                  key={item.to}
                  to={item.to}
                  label={tr(item.label)}
                  onNavigate={closeMobile}
                />
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-2">
              {showDatabaseClearButton && (
                <button
                  type="button"
                  onClick={openClearDatabaseModal}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  {tr('Clear DB')}
                </button>
              )}

              <LanguageSelect
                variant="menu"
                showLabel={false}
                className="w-full"
                buttonClassName="w-full justify-between border-slate-900 bg-white text-sm font-medium text-slate-900 hover:bg-slate-50"
                menuClassName="left-0 right-0 min-w-0 border-slate-900"
              />

              <button
                type="button"
                onClick={() => goToProtected('/app/notifications')}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {tr('Notifications')}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/messages');
                  closeMobile();
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {tr('Messages')}
              </button>

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/auth/signin"
                    onClick={closeMobile}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {tr('Sign In')}
                  </Link>
                  <Link
                    to="/auth/signup"
                    onClick={closeMobile}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {tr('Sign Up')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/app/dashboard"
                    onClick={closeMobile}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {tr('Dashboard')}
                  </Link>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    {tr('Sign Out')}
                  </button>
                </>
              )}
            </div>
          </div>
        </Collapse>
      </MTNavbar>
      {clearDatabaseModal}
    </>
  );
}

export default Navbar;
