import { Typography, IconButton, Button } from '@material-tailwind/react';

const LINKS = ['About Us', 'How It Works', 'Doctors', 'Blog', 'Contact'];
const UNHASHED_LINKS = ['Privacy Policy', 'Terms of Service'];

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-10 bg-gray-900 px-4 pb-8 pt-12 sm:px-8">
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center gap-10 md:justify-between md:gap-12">
          <div className="text-center md:text-left max-w-md">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <img
                src="/image/ogaDoctor.png"
                alt="OgaDoctor Logo"
                className="h-10 w-auto"
              />
              <Typography
                as="a"
                href="/"
                variant="h5"
                color="white"
                className="font-bold"
              >
                OgaDoctor
              </Typography>
            </div>

            <Typography
              color="white"
              className="mb-6 font-normal leading-relaxed sm:mb-8"
            >
              Your on-the-go virtual doctor - certified medical consultations,
              prescriptions, and health advice, anytime, anywhere in Nigeria. No
              queues, no stress.
            </Typography>

            <ul className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
              {LINKS.map((link) => (
                <li key={link}>
                  <Typography
                    as="a"
                    href="#"
                    color="white"
                    className="py-1 font-medium transition-colors hover:text-blue-400"
                  >
                    {link}
                  </Typography>
                </li>
              ))}
              {UNHASHED_LINKS.map((link) => (
                <li key={link}>
                  <Typography
                    as="a"
                    href={
                      link === 'Privacy Policy'
                        ? '/privacy-policy'
                        : '/terms-of-service'
                    }
                    color="white"
                    className="py-1 font-medium transition-colors hover:text-blue-400"
                  >
                    {link}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 w-full text-center md:mt-0 md:w-auto md:text-left">
            <Typography variant="h6" color="white" className="mb-4">
              Download the App
            </Typography>
            <div className="mx-auto flex w-full max-w-sm flex-col gap-3 md:mx-0 md:max-w-none">
              <Button
                color="white"
                size="lg"
                className="flex items-center justify-center gap-3 normal-case shadow-md hover:shadow-lg transition-all"
                onClick={() =>
                  window.open(
                    'https://apps.apple.com/ng/app/ogadoctor',
                    '_blank',
                  )
                }
              >
                <img
                  src="/logos/logo-apple.png"
                  className="h-7 w-7"
                  alt="App Store"
                />
                App Store
              </Button>

              <Button
                color="white"
                size="lg"
                className="flex items-center justify-center gap-3 normal-case shadow-md hover:shadow-lg transition-all"
                onClick={() =>
                  window.open(
                    'https://play.google.com/store/apps/details?id=com.ogadoctor.app',
                    '_blank',
                  )
                }
              >
                <img
                  src="/logos/logo-google.png"
                  className="h-7 w-7"
                  alt="Google Play"
                />
                Google Play
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 border-t border-gray-700 pt-8 md:mt-16 md:justify-between">
          <Typography
            color="white"
            className="max-w-2xl text-center text-sm font-normal opacity-75 md:text-base"
          >
            (c) {CURRENT_YEAR} OgaDoctor. All rights reserved. Made with care in
            Nigeria.
          </Typography>

          <div className="flex gap-3">
            <IconButton variant="text" color="white" size="sm">
              <i className="fa-brands fa-twitter text-2xl opacity-80 hover:opacity-100 transition-opacity" />
            </IconButton>
            <IconButton variant="text" color="white" size="sm">
              <i className="fa-brands fa-facebook text-2xl opacity-80 hover:opacity-100 transition-opacity" />
            </IconButton>
            <IconButton variant="text" color="white" size="sm">
              <i className="fa-brands fa-instagram text-2xl opacity-80 hover:opacity-100 transition-opacity" />
            </IconButton>
            <IconButton variant="text" color="white" size="sm">
              <i className="fa-brands fa-whatsapp text-2xl opacity-80 hover:opacity-100 transition-opacity" />
            </IconButton>
            <IconButton variant="text" color="white" size="sm">
              <i className="fa-brands fa-linkedin text-2xl opacity-80 hover:opacity-100 transition-opacity" />
            </IconButton>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
