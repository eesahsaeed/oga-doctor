import { Button, Typography } from '@material-tailwind/react';

function Hero() {
  return (
    <div className="relative min-h-screen w-full">
      <img
        src="/image/main-bg.jpg"
        alt="Background medical pattern"
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
              Your On-the-Go <br /> Virtual Doctor
            </Typography>
            <Typography
              variant="lead"
              className="mb-7 text-base !text-white sm:text-lg md:pr-16 xl:pr-28"
            >
              OgaDoctor brings certified medical doctors right to your phone -
              consult anytime, anywhere in Nigeria, without queues or travel
              stress.
            </Typography>
            <div className="flex flex-col gap-2 md:mb-2 md:w-10/12 md:flex-row">
              <Button
                size="lg"
                color="white"
                className="flex w-full items-center justify-center gap-3 md:w-auto"
              >
                <img
                  src="/logos/logo-apple.png"
                  alt="App Store"
                  className="w-6 h-6"
                />
                App Store
              </Button>
              <Button
                size="lg"
                color="white"
                className="flex w-full items-center justify-center gap-3 md:w-auto"
              >
                <img
                  src="/logos/logo-google.png"
                  alt="Google Play"
                  className="w-6 h-6"
                />
                Google Play
              </Button>
            </div>
          </div>
          <div
            className="
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
              src="/image/new-slogan.png"
              alt="Smiling confident African woman using OgaDoctor app"
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
            OgaDoctor - Your Virtual Clinic
          </Typography>
          <Typography
            variant="paragraph"
            className="font-normal !text-gray-500 lg:w-7/12 xl:w-5/12"
          >
            Download the app for instant access to licensed doctors, virtual
            consultations, prescriptions, and health advice - all from the
            comfort of home or on the move. No more long waits at hospitals.
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default Hero;
