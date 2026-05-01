import React from 'react';
import { Typography, Card, CardBody, Avatar } from '@material-tailwind/react';

export function TestimonialCard({ img, feedback, client, title }) {
  return (
    <Card shadow={false} className="items-center text-center">
      <CardBody className="p-5 sm:p-6">
        <Avatar src={img} className="mb-3" alt={client} size="lg" />
        <Typography variant="h6" color="blue-gray">
          {client}
        </Typography>
        <Typography variant="small" className="mb-3 font-medium !text-gray-700">
          {title}
        </Typography>
        <Typography
          variant="paragraph"
          className="mb-5 text-sm font-normal !text-gray-500 sm:text-base"
        >
          "{feedback}"
        </Typography>
      </CardBody>
    </Card>
  );
}

export default TestimonialCard;
