import { useLanguage } from '../context/LanguageContext';

const DISCLAIMER_ITEMS = [
  'The Service is for informational and educational purposes only',
  'Aisha is not a doctor, nurse, or licensed healthcare provider',
  'No doctor-patient relationship is created by using the Service',
  'Never ignore or delay seeking professional medical advice because of something you read or were told in the chat',
  'In case of emergency, call emergency services immediately (112 in Nigeria)',
];

export default function TermsOfService() {
  const { tr } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="bg-blue-600 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold">{tr('Terms of Service')}</h1>
          <p className="mt-2 opacity-90">{tr('Last updated: March 1, 2025')}</p>
        </div>

        <div className="prose prose-blue max-w-none p-8">
          <h2 className="mt-8 text-2xl font-semibold">
            {tr('1. Acceptance of Terms')}
          </h2>
          <p>
            {tr(
              'By accessing or using the Aisha AI Health Assistant chat widget at ogadoctor.com.ng ("Service"), you agree to be bound by these Terms of Service ("Terms").',
            )}
          </p>
          <p className="mt-4">
            {tr('If you do not agree, you must not use the Service.')}
          </p>

          <h2 className="mt-10 text-2xl font-semibold">
            {tr('2. Description of Service')}
          </h2>
          <p>
            {tr(
              'The Service is an AI-powered chat interface that provides general health-related information and conversation.',
            )}
          </p>
          <p className="mt-4 font-semibold text-red-700">
            {tr(
              'It is not a substitute for professional medical advice, diagnosis, or treatment.',
            )}
          </p>

          <h2 className="mt-10 text-2xl font-semibold">
            {tr('3. No Medical Advice - Important Disclaimer')}
          </h2>
          <div className="my-6 rounded-r-xl border-l-4 border-red-500 bg-red-50 p-6">
            <p className="font-medium text-red-800">
              {tr('YOU ACKNOWLEDGE AND AGREE THAT:')}
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-red-900">
              {DISCLAIMER_ITEMS.map((item) => (
                <li key={item}>{tr(item)}</li>
              ))}
            </ul>
          </div>

          <h2 className="mt-10 text-2xl font-semibold">{tr('12. Contact')}</h2>
          <p>{tr('Questions about these Terms should be sent to:')}</p>
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
