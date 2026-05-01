import { Typography, Card, CardBody } from '@material-tailwind/react';

export function FeatureCard({ icon: Icon, title, children }) {
  return (
    <Card color="transparent" shadow={false}>
      <CardBody className="grid justify-start px-2 sm:px-4">
        <div className="mb-4 grid h-12 w-12 place-content-center rounded-lg bg-gray-900 p-2.5 text-left text-white">
          <Icon className="h-6 w-6" />
        </div>
        <Typography variant="h5" color="blue-gray" className="mb-2 text-xl">
          {title}
        </Typography>
        <Typography className="text-sm font-normal !text-gray-500 sm:text-base">
          {children}
        </Typography>
      </CardBody>
    </Card>
  );
}

export default FeatureCard;
