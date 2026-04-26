import React from "react";
import { Typography, Card, CardBody, Avatar } from "@material-tailwind/react";

export function TestimonialCard({ img, feedback, client, title }) {
  return (
    <Card shadow={false} className="items-center text-center">
      <CardBody>
        <Avatar src={img} className="mb-3" alt={client} size="lg" />
        <Typography variant="h6" color="blue-gray">
          {client}
        </Typography>
        <Typography variant="small" className="mb-3 font-medium !text-gray-700">
          {title}
        </Typography>
        <Typography
          variant="paragraph"
          className="mb-5 font-normal !text-gray-500"
        >
          "{feedback}"
        </Typography>
      </CardBody>
    </Card>
  );
}

export default TestimonialCard;
