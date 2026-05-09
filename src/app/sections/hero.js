import { Typography } from '@material-tailwind/react';
import { useLanguage } from '../context/LanguageContext';

const APP_LINKS = [
  {
    label: 'App Store',
    icon: '/logos/logo-apple.png',
    href: 'https://apps.apple.com/ng/app/ogadoctor',
  },
  {
    label: 'Google Play',
    icon: '/logos/logo-google.png',
    href: 'https://play.google.com/store/apps/details?id=com.ogadoctor.app',
  },
];

function Hero() {
  const { tr } = useLanguage();

  return (
    <div className="relative min-h-screen w-full">
      <img
        src="/image/main-bg.jpg"
        alt={tr('Background medical pattern')}
        className="absolute inset-0 h-full w-full object-cover main-background"
      />
      <header className="grid min-h-[43rem] bg-gray-900 px-4 main-container sm:min-h-[48rem] sm:px-8">
        <div className="container mx-auto mt-24 grid h-full w-full grid-cols-1 place-items-center sm:mt-28 lg:mt-14 lg:grid-cols-2">
          <div className="col-span-1">
            <Typography
              variant="h1"
              color="white"
              className="mb-4 text-3xl leading-tight sm:text-5xl"
            >
              {tr('Your On-the-Go Virtual Doctor')}
            </Typography>
            <Typography
              variant="lead"
              className="mb-7 text-base !text-white sm:text-lg md:pr-16 xl:pr-28"
            >
              {tr(
                'OgaDoctor brings certified medical doctors right to your phone - consult anytime, anywhere in Nigeria, without queues or travel stress.',
              )}
            </Typography>
            <div className="flex flex-col gap-2 md:mb-2 md:w-10/12 md:flex-row">
              {APP_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 md:w-auto"
                  style={{
                    color: '#0f172a',
                    borderColor: '#e2e8f0',
                    backgroundColor: '#ffffff',
                    boxShadow:
                      '0 10px 24px rgba(15, 23, 42, 0.18), 0 4px 10px rgba(15, 23, 42, 0.1)',
                  }}
                >
                  <img
                    src={link.icon}
                    alt={tr(link.label)}
                    className="h-6 w-6"
                  />
                  <span style={{ color: '#0f172a' }}>{tr(link.label)}</span>
                </a>
              ))}
            </div>
          </div>
          <div
            className="
              hidden
              md:block
              col-span-1
              relative
              my-8
              -translate-y-8
              min-h-[280px]
              w-full
              md:min-h-[400px]
              md:max-h-[36rem]
              lg:my-0
              lg:ml-auto
              lg:min-h-[520px]
              lg:max-h-[44rem]
              lg:max-w-[620px]
              lg:translate-y-12
              aspect-[600/576]
            "
          >
            <img
              src="/image/aisha.png"
              alt={tr('Aisha AI assistant')}
              className="absolute inset-0 h-full w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      </header>
      <div className="-mt-12 mx-4 rounded-xl bg-white p-4 shadow-md sm:-mt-16 sm:mx-8 sm:p-6 md:-mt-24 md:p-14 lg:mx-16">
        <div>
          <Typography
            variant="h3"
            color="blue-gray"
            className="mb-3 text-2xl sm:text-3xl"
          >
            {tr('OgaDoctor - Your Virtual Clinic')}
          </Typography>
          <Typography
            variant="paragraph"
            className="font-normal !text-gray-500 lg:w-7/12 xl:w-5/12"
          >
            {tr(
              'Download the app for instant access to licensed doctors, virtual consultations, prescriptions, and health advice - all from the comfort of home or on the move. No more long waits at hospitals.',
            )}
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default Hero;
