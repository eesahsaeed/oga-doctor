import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import AuthPageShell from '../../components/auth/AuthPageShell';
import AuthStatusMessage from '../../components/auth/AuthStatusMessage';

export default function ForgotPasswordPage() {
  const { tr, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [debugLink, setDebugLink] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setDebugLink('');

    if (!email.trim()) {
      setError(tr('Email is required.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = await apiClient.forgotPassword({
        email: email.trim().toLowerCase(),
        language,
      });
      setSuccessMessage(
        payload?.message ||
          tr(
            'If an account with that email exists, a password reset link has been sent.',
          ),
      );
      setDebugLink(payload?.debug?.resetLink || '');
    } catch (requestError) {
      if (requestError?.status === 404) {
        setError(
          tr(
            'We could not find an account with that email. Check the address and try again.',
          ),
        );
      } else {
        setError(
          requestError.message ||
            tr('Unable to start password reset right now.'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title={tr('Forgot password?')}
      subtitle={tr(
        'Enter your email and we will send you a secure password reset link.',
      )}
      highlights={['Notifications', 'Doctor Messages', 'Video Consultation']}
      footer={
        <p className="text-sm text-slate-600">
          <Link
            to="/auth/signin"
            className="font-semibold text-cyan-600 transition hover:text-cyan-700"
          >
            {tr('Back to Sign In')}
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {tr('Email address')}
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder={tr('you@example.com')}
          />
        </label>

        <AuthStatusMessage variant="danger">{error}</AuthStatusMessage>

        <AuthStatusMessage variant="success">
          {successMessage}
        </AuthStatusMessage>

        {debugLink && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">{tr('Development reset link')}</p>
            <a
              href={debugLink}
              className="mt-1 block break-all text-cyan-600 underline transition hover:text-cyan-700"
            >
              {debugLink}
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="relative z-10 flex h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
          style={{
            border: '1px solid #0f172a',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            boxShadow: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        >
          {submitting ? tr('Sending reset link...') : tr('Send Reset Link')}
        </button>
      </form>
    </AuthPageShell>
  );
}
