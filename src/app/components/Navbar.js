import React from 'react';
import {
  Navbar as MTNavbar,
  Collapse,
  IconButton,
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

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
  { to: '/blog', label: 'Blog' },
];

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

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();

  const isHome = location.pathname === '/';
  const isLightMode = !isHome || isScrolling || open;

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
  const iconColor = isLightMode ? 'gray' : 'white';

  const avatarText = user?.name || user?.email || 'Oga Doctor';
  const avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarText)}&background=2563eb&color=fff`;

  return (
    <MTNavbar
      fullWidth
      shadow={false}
      blurred={false}
      color={isLightMode ? 'white' : 'transparent'}
      className="fixed top-0 z-50 border-0 transition-colors duration-300 py-0"
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center py-0" onClick={closeMobile}>
          <img
            src="/image/ogaDoctor.png"
            alt="OgaDoctor Logo"
            className={`h-16 w-16 m-2 transition-all duration-300 ${logoClass}`}
          />
        </Link>

        <ul className="ml-8 lg:ml-12 hidden items-center gap-6 lg:gap-8 lg:flex">
          {navItems.map((item) => (
            <DesktopNavLink
              key={item.to}
              to={item.to}
              label={item.label}
              isLightMode={isLightMode}
            />
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <IconButton
            variant="text"
            color={iconColor}
            size="sm"
            onClick={() => goToProtected('/app/notifications')}
          >
            <BellIcon className="h-6 w-6" />
          </IconButton>

          <IconButton
            variant="text"
            color={iconColor}
            size="sm"
            onClick={() => {
              navigate('/messages');
              closeMobile();
            }}
          >
            <EnvelopeIcon className="h-6 w-6" />
          </IconButton>

          {!isAuthenticated ? (
            <>
              <Link
                to="/auth/signin"
                className="rounded-xl border border-blue-gray-200 px-3 py-2 text-sm font-medium text-blue-gray-900 hover:bg-blue-gray-50"
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/app/dashboard"
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Dashboard
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
                      alt="User Profile"
                      src={avatarSrc}
                      className="cursor-pointer ring-2 ring-offset-2 ring-blue-500/30 hover:ring-blue-500/50 transition-all"
                    />
                    <ChevronDownIcon
                      strokeWidth={2.5}
                      className={`
                        h-4 w-4 transition-transform duration-200 ease-in-out
                        ${isLightMode ? 'text-gray-700' : 'text-white'}
                        ${profileOpen ? 'rotate-180' : 'rotate-0'}
                      `}
                    />
                  </button>
                </MenuHandler>

                <MenuList className="p-2 min-w-[190px]">
                  <MenuItem
                    className="flex items-center gap-3 py-2"
                    onClick={() => {
                      navigate('/app/profile');
                      setProfileOpen(false);
                    }}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <Typography variant="small" className="font-medium">
                      My Profile
                    </Typography>
                  </MenuItem>

                  <MenuItem
                    className="flex items-center gap-3 py-2"
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
                    <Typography variant="small" className="font-medium">
                      Settings
                    </Typography>
                  </MenuItem>

                  <hr className="my-2 border-blue-gray-50" />

                  <MenuItem
                    className="flex items-center gap-3 py-2 text-red-600 focus:text-red-600"
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
                    <Typography variant="small" className="font-medium">
                      Sign Out
                    </Typography>
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          )}
        </div>

        <IconButton
          variant="text"
          color={iconColor}
          onClick={() => setOpen((cur) => !cur)}
          className="ml-auto lg:hidden"
        >
          {open ? (
            <XMarkIcon strokeWidth={2} className="h-7 w-7" />
          ) : (
            <Bars3Icon strokeWidth={2} className="h-7 w-7" />
          )}
        </IconButton>
      </div>

      <Collapse open={open}>
        <div className="container mx-auto mt-2 border-t border-blue-gray-50 bg-white px-6 py-6">
          <ul className="flex flex-col gap-5 text-blue-gray-900">
            {navItems.map((item) => (
              <MobileNavLink
                key={item.to}
                to={item.to}
                label={item.label}
                onNavigate={closeMobile}
              />
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => goToProtected('/app/notifications')}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Notifications
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/messages');
                closeMobile();
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Messages
            </button>

            {!isAuthenticated ? (
              <>
                <Link
                  to="/auth/signin"
                  onClick={closeMobile}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  onClick={closeMobile}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/app/dashboard"
                  onClick={closeMobile}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </Collapse>
    </MTNavbar>
  );
}

export default Navbar;
