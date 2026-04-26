import React from "react";
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
} from "@material-tailwind/react";
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  EnvelopeIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

function NavItem({ children, href }) {
  return (
    <li>
      <Typography
        as="a"
        href={href || "#"}
        target={href ? "_blank" : "_self"}
        variant="small"
        className="font-medium"
      >
        {children}
      </Typography>
    </li>
  );
}

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  function handleOpen() {
    setOpen((cur) => !cur);
  }

  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpen(false)
    );
  }, []);

  React.useEffect(() => {
    function handleScroll() {
      setIsScrolling(window.scrollY > 0);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <MTNavbar
      fullWidth
      shadow={false}
      blurred={false}
      color={isScrolling ? "white" : "transparent"}
      className="fixed top-0 z-50 border-0 transition-colors duration-300 py-0"
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center py-0">
          <img
            src="/image/ogaDoctor.png"
            alt="OgaDoctor Logo"
            className={`h-16 w-16 m-2 transition-all duration-300 ${
              isScrolling ? "brightness-100" : "brightness-0 invert"
            }`}
          />
        </a>

        <ul
          className={`
            ml-8 lg:ml-12
            hidden items-center gap-6 lg:gap-8
            lg:flex
            ${isScrolling ? "text-gray-900" : "text-white"}
          `}
        >
          <NavItem>Home</NavItem>
          <NavItem>About</NavItem>
          <NavItem>Services</NavItem>
          <NavItem>Contact</NavItem>
          <NavItem href="/blog">Blog</NavItem>
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          <IconButton
            variant="text"
            color={isScrolling ? "gray" : "white"}
            size="sm"
          >
            <BellIcon className="h-6 w-6" />
          </IconButton>

          <IconButton
            variant="text"
            color={isScrolling ? "gray" : "white"}
            size="sm"
          >
            <EnvelopeIcon className="h-6 w-6" />
          </IconButton>

          <Menu>
            <MenuHandler>
              <button
                className="flex items-center gap-1.5 rounded-full focus:outline-none"
                onClick={() => setProfileOpen((prev) => !prev)}
              >
                <Avatar
                  variant="circular"
                  size="sm"
                  alt="User Profile"
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1480&q=80"
                  className="cursor-pointer ring-2 ring-offset-2 ring-blue-500/30 hover:ring-blue-500/50 transition-all"
                />
                <ChevronDownIcon
                  strokeWidth={2.5}
                  className={`
                    h-4 w-4 transition-transform duration-200 ease-in-out
                    ${isScrolling ? "text-gray-700" : "text-white"}
                    ${profileOpen ? "rotate-180" : "rotate-0"}
                  `}
                />
              </button>
            </MenuHandler>

            <MenuList className="p-2 min-w-[180px]">
              <MenuItem className="flex items-center gap-3 py-2">
                <UserCircleIcon className="h-5 w-5" />
                <Typography variant="small" className="font-medium">
                  My Profile
                </Typography>
              </MenuItem>
              <MenuItem className="flex items-center gap-3 py-2">
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
              <MenuItem className="flex items-center gap-3 py-2 text-red-600 focus:text-red-600">
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
        </div>

        <IconButton
          variant="text"
          color={isScrolling ? "gray" : "white"}
          onClick={handleOpen}
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
            <NavItem>Home</NavItem>
            <NavItem>About</NavItem>
            <NavItem>Services</NavItem>
            <NavItem>Contact</NavItem>
            <NavItem href="/blog">Blog</NavItem>
          </ul>
        </div>
      </Collapse>
    </MTNavbar>
  );
}

export default Navbar;
