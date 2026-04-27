import { Link } from 'react-router-dom';
import MarketingPageLayout from '../../components/marketing/MarketingPageLayout';

const services = [
  {
    title: 'Video Consultation',
    body: 'Meet a doctor remotely with live consultation and follow-up recommendations.',
    link: '/auth/signin',
    cta: 'Book Video Visit',
  },
  {
    title: 'AI Health Chat',
    body: 'Get quick symptom guidance and care direction powered by our AI assistant.',
    link: '/auth/signin',
    cta: 'Start AI Chat',
  },
  {
    title: 'Lab Scheduling',
    body: 'Book lab visits and keep your test timeline organized in one care workspace.',
    link: '/auth/signin',
    cta: 'Schedule Lab Visit',
  },
  {
    title: 'Health Records',
    body: 'Access reports, prescriptions, and medical history from your dashboard.',
    link: '/auth/signin',
    cta: 'View Care Workspace',
  },
];

export default function ServicesPage() {
  return (
    <MarketingPageLayout
      title="Services"
      subtitle="Choose from consultation, diagnostics, and continuous health management services."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <article
            key={service.title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {service.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{service.body}</p>
            <Link
              to={service.link}
              className="inline-flex mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {service.cta}
            </Link>
          </article>
        ))}
      </div>
    </MarketingPageLayout>
  );
}
