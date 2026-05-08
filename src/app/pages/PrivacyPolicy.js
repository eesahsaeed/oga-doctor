import { useLanguage } from '../context/LanguageContext';

const PROVIDED_ITEMS = [
  'Messages you send in the chat (health symptoms, questions, etc.)',
  'Any personal details you choose to include in messages (name, age, gender, location, medical history, etc.)',
  'Contact information if you explicitly provide it',
];

const AUTO_ITEMS = [
  'Technical data: IP address, browser type and version, device type, operating system, approximate location (derived from IP)',
  'Usage data: timestamps of messages, chat open/close events, session duration',
  'Cookies / similar technologies (if implemented later): small data files used for functionality',
];

const EXCLUDED_ITEMS = [
  'Precise geolocation (unless you explicitly tell us in chat)',
  'Payment information (we do not process payments)',
  'Health insurance numbers, passport numbers, or government IDs (unless you voluntarily type them)',
];

const USE_ITEMS = [
  'Provide, maintain and improve the Aisha AI Health Assistant',
  'Understand and respond to your health-related questions',
  'Generate analytics about usage patterns (aggregated / anonymized)',
  'Detect abuse, spam or technical issues',
  'Comply with legal obligations',
];

export default function PrivacyPolicy() {
  const { tr } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="bg-blue-600 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold">{tr('Privacy Policy')}</h1>
          <p className="mt-2 opacity-90">{tr('Last updated: March 1, 2025')}</p>
        </div>

        <div className="prose prose-blue max-w-none p-8">
          <h2 className="mt-8 text-2xl font-semibold">
            {tr('1. Introduction')}
          </h2>
          <p>
            {tr(
              'OgaDoctor ("we", "us", "our") operates the Aisha AI Health Assistant chat widget available at ogadoctor.com.ng (the "Service").',
            )}
          </p>
          <p className="mt-4">
            {tr(
              'This Privacy Policy explains what information we collect, how we use it, who we share it with, and what rights you have regarding your personal data.',
            )}
          </p>
          <p className="mt-4">
            {tr(
              'By using the Service you agree to the collection and use of information in accordance with this policy.',
            )}
          </p>

          <h2 className="mt-10 text-2xl font-semibold">
            {tr('2. Information We Collect')}
          </h2>

          <h3 className="mt-6 text-xl font-medium">
            {tr('2.1 Information you voluntarily provide')}
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {PROVIDED_ITEMS.map((item) => (
              <li key={item}>{tr(item)}</li>
            ))}
          </ul>

          <h3 className="mt-6 text-xl font-medium">
            {tr('2.2 Automatically collected information')}
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {AUTO_ITEMS.map((item) => (
              <li key={item}>{tr(item)}</li>
            ))}
          </ul>

          <h3 className="mt-6 text-xl font-medium">
            {tr('2.3 We do NOT collect')}
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {EXCLUDED_ITEMS.map((item) => (
              <li key={item}>{tr(item)}</li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl font-semibold">
            {tr('3. How We Use Your Information')}
          </h2>
          <p>{tr('We use the collected information to:')}</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {USE_ITEMS.map((item) => (
              <li key={item}>{tr(item)}</li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl font-semibold">
            {tr('12. Contact Us')}
          </h2>
          <p>{tr('For any questions about this Privacy Policy, contact:')}</p>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <p className="font-medium">{tr('OgaDoctor')}</p>
            <p>
              {tr('Email')}:{' '}
              <a
                href="mailto:support@ogadoctor.com.ng"
                className="text-blue-600 hover:underline"
              >
                support@ogadoctor.com.ng
              </a>
            </p>
            <p>
              {tr('Website')}:{' '}
              <a href="/" className="text-blue-600 hover:underline">
                ogadoctor.com.ng
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
