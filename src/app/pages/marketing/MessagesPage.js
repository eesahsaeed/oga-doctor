import { Link } from 'react-router-dom';
import MarketingPageLayout from '../../components/marketing/MarketingPageLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function MessagesPage() {
  const { tr } = useLanguage();

  return (
    <MarketingPageLayout
      title={tr('Messages')}
      subtitle={tr(
        'Use your care workspace inbox for care updates, reminders, and support messages.',
      )}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Care Inbox')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {tr(
              'Sign in to view appointment reminders, lab updates, and provider communication.',
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/auth/signin"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {tr('Sign In')}
            </Link>
            <Link
              to="/app/notifications"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {tr('Open Notifications')}
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Need Help?')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {tr(
              'If you are having account issues, contact support immediately.',
            )}
          </p>
          <a
            href="mailto:support@ogadoctor.com.ng"
            className="mt-3 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            {tr('Email Support')}
          </a>
        </div>
      </div>
    </MarketingPageLayout>
  );
}
