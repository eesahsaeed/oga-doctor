"use client";

import React from "react";
import { Typography, Card } from "@material-tailwind/react";

const FAQS = [
  {
    title: "How do I start a consultation?",
    desc: "Download the OgaDoctor app from the Play Store or App Store, create a quick profile (email or phone number), and tap 'Consult Now'. You can start chatting or request a video call instantly â€” no long registration needed.",
  },
  {
    title: "Is OgaDoctor free to use?",
    desc: "Yes â€” you can browse doctors, read health tips, and send initial messages for free. Video calls, voice consultations, and prescriptions require payment per session or a subscription plan. First-time users often get a discounted or free introductory consultation.",
  },
  {
    title: "How do I pay for consultations?",
    desc: "We accept mobile money (OPay, Palmpay, Paga), bank cards (Visa, Verve, Mastercard), and USSD payments. All transactions are secure and processed instantly within the app.",
  },
  {
    title: "Can I cancel or reschedule a consultation?",
    desc: "Yes â€” you can cancel or reschedule up to 30 minutes before the scheduled time with no charge. Just go to 'My Appointments' in the app and select the option. Late cancellations may incur a small fee.",
  },
  {
    title: "Are the doctors licensed and verified?",
    desc: "All doctors on OgaDoctor are fully licensed by the Medical and Dental Council of Nigeria (MDCN). Every profile shows their MDCN number, years of experience, and verified credentials. We only work with certified professionals.",
  },
  {
    title: "What if I have an emergency or technical issue?",
    desc: "For emergencies, call 112 or go to the nearest hospital immediately â€” OgaDoctor is not for life-threatening situations. For app issues or urgent non-emergency help, use the in-app live chat (24/7) or send us an email at support@ogadoctor.com. We usually respond within minutes.",
  },
];

export function Faqs() {
  return (
    <section className="px-8 py-20">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center">
          <Typography variant="h1" color="blue-gray" className="mb-4">
            Frequently asked questions
          </Typography>
          <Typography
            variant="lead"
            className="mx-auto mb-24 !text-gray-500 lg:w-3/5"
          >
            Got questions? Weâ€™ve got clear answers. Find quick help about how OgaDoctor works, payments, doctors, privacy, and more.
          </Typography>
        </div>

        <div className="grid gap-20 md:grid-cols-1 lg:grid-cols-3">
          {FAQS.map(({ title, desc }) => (
            <Card key={title} shadow={false} color="transparent">
              <Typography color="blue-gray" className="pb-6" variant="h4">
                {title}
              </Typography>
              <div className="pt-2">
                <Typography className="font-normal !text-gray-500">
                  {desc}
                </Typography>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Faqs;
