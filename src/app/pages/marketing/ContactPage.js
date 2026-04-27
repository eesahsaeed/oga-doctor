import { useState } from 'react';
import MarketingPageLayout from '../../components/marketing/MarketingPageLayout';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <MarketingPageLayout
      title="Contact"
      subtitle="Reach OgaDoctor support for onboarding help, account questions, and consultation guidance."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Email</p>
            <a
              href="mailto:support@ogadoctor.com.ng"
              className="text-blue-700 font-semibold hover:underline"
            >
              support@ogadoctor.com.ng
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Phone</p>
            <a
              href="tel:+2348000000000"
              className="text-blue-700 font-semibold hover:underline"
            >
              +234 800 000 0000
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Office Hours</p>
            <p className="text-slate-700">
              Mon - Sat, 8:00 AM to 8:00 PM (WAT)
            </p>
          </div>
        </div>

        <form
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Your name
            </span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Message</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              rows={4}
              required
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Send Message
          </button>

          {sent && (
            <p className="text-sm text-emerald-700">
              Thanks, your message has been queued. Our team will respond
              shortly.
            </p>
          )}
        </form>
      </div>
    </MarketingPageLayout>
  );
}
