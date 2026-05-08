'use client';

import React from 'react';
import { Typography } from '@material-tailwind/react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import TestimonialCard from '../components/TestimonialCard';
import { useLanguage } from '../context/LanguageContext';

const TESTIMONIALS = [
  {
    feedback:
      'I was having severe malaria symptoms at night and got connected to a doctor within 4 minutes. Diagnosis was accurate, prescription sent instantly. Saved me a hospital trip!',
    client: 'Aisha Ibrahim',
    title: 'Lagos, Nigeria',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=987&q=80',
  },
  {
    feedback:
      'As a busy mum, I love that I can consult from home while the kids sleep. The doctors are very patient and explain everything clearly in simple English or Pidgin.',
    client: 'Chioma Okeke',
    title: 'Mother of 3 - Abuja',
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=987&q=80',
  },
  {
    feedback:
      'The privacy is excellent - no one knows I consulted except me. Got my hypertension meds renewed without going to the clinic. Very professional service.',
    client: 'Emeka Nwosu',
    title: 'Banker - Port Harcourt',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=987&q=80',
  },
];

export function Testimonials() {
  const { tr } = useLanguage();

  return (
    <section className="bg-gray-50 px-4 py-16 sm:px-6 md:px-10 lg:py-24">
      <div className="container mx-auto">
        <div className="mb-12 flex w-full flex-col items-center text-center sm:mb-16">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
          </div>

          <Typography
            variant="h2"
            color="blue-gray"
            className="mb-3 text-3xl font-bold sm:text-4xl md:text-5xl"
          >
            {tr('What Nigerians Are Saying')}
          </Typography>

          <Typography
            variant="lead"
            className="max-w-3xl !text-gray-600 leading-relaxed"
          >
            {tr(
              'Real stories from people across Nigeria who have experienced faster, easier, and more convenient healthcare with OgaDoctor - no queues, no stress, just quality care when they need it.',
            )}
          </Typography>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:gap-8 xl:gap-10">
          {TESTIMONIALS.map((props, key) => (
            <div
              key={key}
              className="
                transition-all duration-300 ease-in-out
                hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-100/50
                rounded-2xl overflow-hidden bg-white
              "
            >
              <TestimonialCard
                {...props}
                feedback={tr(props.feedback)}
                title={tr(props.title)}
              />
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Typography variant="small" className="text-gray-500">
            {tr('Join')}{' '}
            <span className="font-semibold text-blue-700">12,000+</span>{' '}
            {tr('happy users who trust OgaDoctor for their health needs')}
          </Typography>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
