export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-blue-600 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="mt-2 opacity-90">Last updated: March 1, 2025</p>
        </div>

        <div className="p-8 prose prose-blue max-w-none">
          <h2 className="text-2xl font-semibold mt-8">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the Aisha AI Health Assistant chat widget at{' '}
            <a
              href="https://ogadoctor.com.ng"
              className="text-blue-600 hover:underline"
            >
              ogadoctor.com.ng
            </a>{' '}
            ("Service"), you agree to be bound by these Terms of Service
            ("Terms").
          </p>
          <p className="mt-4">
            If you do <strong>not</strong> agree, you must not use the Service.
          </p>

          <h2 className="text-2xl font-semibold mt-10">
            2. Description of Service
          </h2>
          <p>
            The Service is an AI-powered chat interface that provides general
            health-related information and conversation.
          </p>
          <p className="mt-4 font-semibold text-red-700">
            It is <strong>not</strong> a substitute for professional medical
            advice, diagnosis, or treatment.
          </p>

          <h2 className="text-2xl font-semibold mt-10">
            3. No Medical Advice - Important Disclaimer
          </h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-6 my-6 rounded-r-xl">
            <p className="font-medium text-red-800">
              YOU ACKNOWLEDGE AND AGREE THAT:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-red-900">
              <li>
                The Service is for informational and educational purposes{' '}
                <strong>only</strong>
              </li>
              <li>
                Aisha is <strong>not</strong> a doctor, nurse, or licensed
                healthcare provider
              </li>
              <li>
                No doctor-patient relationship is created by using the Service
              </li>
              <li>
                Never ignore or delay seeking professional medical advice
                because of something you read or were told in the chat
              </li>
              <li>
                In case of emergency, call emergency services immediately (112
                in Nigeria)
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold mt-10">12. Contact</h2>
          <p>Questions about these Terms should be sent to:</p>
          <div className="mt-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <p className="font-medium">OgaDoctor</p>
            <p>
              Email:{' '}
              <a
                href="mailto:support@ogadoctor.com.ng"
                className="text-blue-600 hover:underline"
              >
                support@ogadoctor.com.ng
              </a>
            </p>
            <p>
              Website:{' '}
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
