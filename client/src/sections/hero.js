import { Button, Typography } from "@material-tailwind/react";

function Hero() {
  return (
    <div className="relative min-h-screen w-full">
      <img
        src="/image/main-bg.jpg"
        alt="Background medical pattern"
        className="absolute inset-0 h-full w-full object-contain main-background"
      />
      <header className="grid !min-h-[49rem] bg-gray-900 px-8 main-container">
        <div className="container mx-auto mt-32 grid h-full w-full grid-cols-1 place-items-center lg:mt-14 lg:grid-cols-2">
          <div className="col-span-1">
            <Typography variant="h1" color="white" className="mb-4">
              Your On-the-Go <br /> Virtual Doctor
            </Typography>
            <Typography
              variant="lead"
              className="mb-7 !text-white md:pr-16 xl:pr-28"
            >
              OgaDoctor brings certified medical doctors right to your phone - consult anytime, anywhere in Nigeria, without queues or travel stress.
            </Typography>
            <div className="flex flex-col gap-2 md:mb-2 md:w-10/12 md:flex-row">
              <Button
                size="lg"
                color="white"
                className="flex justify-center items-center gap-3"
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
                className="flex justify-center items-center gap-3"
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
              my-20
              -translate-y-32
              min-h-[320px]
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
              className="absolute inset-0 h-full w-full object-contain rounded-2xl"
            />
          </div>
        </div>
      </header>
      <div className="mx-8 lg:mx-16 -mt-24 rounded-xl bg-white p-5 md:p-14 shadow-md">
        <div>
          <Typography variant="h3" color="blue-gray" className="mb-3">
            OgaDoctor - Your Virtual Clinic
          </Typography>
          <Typography
            variant="paragraph"
            className="font-normal !text-gray-500 lg:w-5/12"
          >
            Download the app for instant access to licensed doctors, virtual consultations, prescriptions, and health advice - all from the comfort of home or on the move. No more long waits at hospitals.
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default Hero;
