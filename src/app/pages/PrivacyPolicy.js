export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-blue-600 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 opacity-90">Last updated: March 1, 2025</p>
        </div>

        <div className="p-8 prose prose-blue max-w-none">
          <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
          <p>
            OgaDoctor ("we", "us", "our") operates the Aisha AI Health Assistant
            chat widget available at{' '}
            <a
              href="https://ogadoctor.com.ng"
              className="text-blue-600 hover:underline"
            >
              ogadoctor.com.ng
            </a>{' '}
            (the "Service").
          </p>
          <p className="mt-4">
            This Privacy Policy explains what information we collect, how we use
            it, who we share it with, and what rights you have regarding your
            personal data.
          </p>
          <p className="mt-4">
            By using the Service you agree to the collection and use of
            information in accordance with this policy.
          </p>

          <h2 className="text-2xl font-semibold mt-10">
            2. Information We Collect
          </h2>

          <h3 className="text-xl font-medium mt-6">
            2.1 Information you voluntarily provide
          </h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              Messages you send in the chat (health symptoms, questions, etc.)
            </li>
            <li>
              Any personal details you choose to include in messages (name, age,
              gender, location, medical history, etc.)
            </li>
            <li>Contact information if you explicitly provide it</li>
          </ul>

          <h3 className="text-xl font-medium mt-6">
            2.2 Automatically collected information
          </h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              Technical data: IP address, browser type and version, device type,
              operating system, approximate location (derived from IP)
            </li>
            <li>
              Usage data: timestamps of messages, chat open/close events,
              session duration
            </li>
            <li>
              Cookies / similar technologies (if implemented later): small data
              files used for functionality
            </li>
          </ul>

          <h3 className="text-xl font-medium mt-6">2.3 We do NOT collect</h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Precise geolocation (unless you explicitly tell us in chat)</li>
            <li>Payment information (we do not process payments)</li>
            <li>
              Health insurance numbers, passport numbers, or government IDs
              (unless you voluntarily type them)
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10">
            3. How We Use Your Information
          </h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide, maintain and improve the Aisha AI Health Assistant</li>
            <li>Understand and respond to your health-related questions</li>
            <li>
              Generate analytics about usage patterns (aggregated / anonymized)
            </li>
            <li>Detect abuse, spam or technical issues</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10">12. Contact Us</h2>
          <p>For any questions about this Privacy Policy, contact:</p>
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
