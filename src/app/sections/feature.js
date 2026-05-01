'use client';

import React from 'react';
import { Typography } from '@material-tailwind/react';

import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/solid';

import FeatureCard from '../components/FeatureCard';

const FEATURES = [
  {
    icon: DevicePhoneMobileIcon,
    title: 'On-the-Go Access',
    children:
      'Consult certified doctors anytime, anywhere in Nigeria â€” right from your phone. No travel, no queues, just instant care when you need it.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Multiple Consultation Modes',
    children:
      'Choose text chat, voice calls, or full video consultations. Connect seamlessly with doctors through our mobile app or website.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure & Private',
    children:
      'Your health data is protected with end-to-end encryption. Access your personal health records and consultation history safely.',
  },
  {
    icon: ClockIcon,
    title: 'Fast & Convenient',
    children:
      'Quick scheduling, real-time notifications, and 24/7 availability for urgent concerns â€” healthcare that fits your busy life.',
  },
];

export function Features() {
  return (
    <section className="bg-white px-4 py-16 sm:py-24 lg:py-28">
      <div className="container mx-auto mb-12 text-center sm:mb-20">
        <Typography color="blue-gray" className="mb-2 font-bold uppercase">
          OgaDoctor â€“ Your Virtual Clinic
        </Typography>
        <Typography
          variant="h1"
          color="blue-gray"
          className="mb-4 text-3xl sm:text-4xl lg:text-5xl"
        >
          Why Choose OgaDoctor?
        </Typography>
        <Typography
          variant="lead"
          className="mx-auto w-full px-2 !text-gray-500 sm:px-4 lg:w-10/12 lg:px-8"
        >
          Get certified medical advice, prescriptions, and care without leaving
          home. OgaDoctor brings quality healthcare directly to your phone â€”
          fast, secure, and stress-free across Nigeria.
        </Typography>
      </div>

      <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-6 gap-y-8 md:grid-cols-2 lg:grid-cols-2">
        {FEATURES.map((props, idx) => (
          <FeatureCard key={idx} {...props} />
        ))}
      </div>
    </section>
  );
}

export default Features;
