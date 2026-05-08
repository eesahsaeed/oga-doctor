import MarketingPageLayout from '../../components/marketing/MarketingPageLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function AboutPage() {
  const { tr } = useLanguage();

  return (
    <MarketingPageLayout
      title={tr('About OgaDoctor')}
      subtitle={tr(
        'OgaDoctor provides trusted digital healthcare access in Nigeria with licensed doctors, virtual consultations, and personalized support.',
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Mission')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {tr(
              'Make quality care accessible with fast, secure, and reliable digital health services.',
            )}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Care Team')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {tr(
              'Our platform connects you with vetted doctors and specialists for continuity of care.',
            )}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Technology')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {tr(
              'Built for secure communication, appointment management, and real-time consultation support.',
            )}
          </p>
        </article>
      </div>
    </MarketingPageLayout>
  );
}
