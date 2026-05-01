import React from 'react';
import InfoCard from '../components/InfoCard';
import { Typography, Button } from '@material-tailwind/react';

const STATS = [
  {
    title: '24/7',
    description: 'Doctor Access',
  },
  {
    title: '5 min',
    description: 'Average Wait Time',
  },
  {
    title: '100+',
    description: 'Certified Doctors',
  },
  {
    title: '4.8/5',
    description: 'User Rating',
  },
];

export function MobileConvenience() {
  return (
    <section className="bg-gray-50 px-4 py-16 sm:px-6 md:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 xl:gap-16">
        <div className="flex justify-center lg:justify-start relative">
          <div className="relative w-full max-w-[360px] md:max-w-[420px] lg:max-w-[480px]">
            <img
              src="/image/iphone.png"
              alt="OgaDoctor app on iPhone showing virtual consultation"
              className="w-full h-auto drop-shadow-2xl rounded-3xl"
            />

            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-blue-600/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0 px-4 lg:px-0">
          <Typography
            variant="h2"
            color="blue-gray"
            className="mb-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
          >
            Healthcare in Your Pocket
          </Typography>

          <Typography
            variant="lead"
            className="mb-8 text-lg !text-gray-600 leading-relaxed sm:text-xl md:text-2xl"
          >
            Consult certified doctors anytime, anywhere in Nigeria - right from
            your phone. No travel, no long queues, just fast, reliable care
            whenever you need it most.
          </Typography>

          <div className="mb-10 mt-6 grid grid-cols-2 gap-6 md:gap-8">
            {STATS.map(({ title, description }) => (
              <InfoCard key={title} title={title}>
                {description}
              </InfoCard>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:items-start">
            <Typography
              variant="h6"
              color="blue-gray"
              className="mb-2 sm:mb-0 sm:mr-4"
            >
              Get the App
            </Typography>

            <Button
              size="lg"
              color="blue"
              className="flex w-full items-center justify-center gap-3 normal-case shadow-md transition-all hover:shadow-lg sm:w-auto"
              onClick={() =>
                window.open('https://apps.apple.com/ng/app/ogadoctor', '_blank')
              }
            >
              <img
                src="/logos/logo-apple.png"
                alt="Apple App Store"
                className="w-7 h-7"
              />
              App Store
            </Button>

            <Button
              size="lg"
              color="green"
              className="flex w-full items-center justify-center gap-3 normal-case shadow-md transition-all hover:shadow-lg sm:w-auto"
              onClick={() =>
                window.open(
                  'https://play.google.com/store/apps/details?id=com.ogadoctor.app',
                  '_blank',
                )
              }
            >
              <img
                src="/logos/logo-google.png"
                alt="Google Play Store"
                className="w-7 h-7"
              />
              Google Play
            </Button>
          </div>

          <Typography variant="small" className="mt-6 text-gray-500">
            Available now for iOS and Android - Free to download - No
            registration required for first consultation
          </Typography>
        </div>
      </div>
    </section>
  );
}

export default MobileConvenience;
