import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import AuthPageShell from '../../components/auth/AuthPageShell';
import AuthStatusMessage from '../../components/auth/AuthStatusMessage';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { tr, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(
    () => String(searchParams.get('token') || '').trim(),
    [searchParams],
  );

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checking, setChecking] = useState(Boolean(initialToken));
  const [validToken, setValidToken] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateToken() {
      if (!initialToken) {
        setChecking(false);
        setValidToken(false);
        return;
      }

      setChecking(true);
      try {
        await apiClient.validateResetPasswordToken(initialToken, language);
        if (active) {
          setValidToken(true);
          setError('');
        }
      } catch (validationError) {
        if (active) {
          setValidToken(false);
          setError(
            validationError.message ||
              tr('Reset link is invalid or has expired.'),
          );
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    validateToken();

    return () => {
      active = false;
    };
  }, [initialToken, language]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError(tr('Reset token is required.'));
      return;
    }
    if (!password) {
      setError(tr('Password is required.'));
      return;
    }
    if (password.length < 6) {
      setError(tr('Password must be at least 6 characters long.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(tr('Passwords do not match.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = await apiClient.resetPassword({
        token: trimmedToken,
        password,
        language,
      });

      setSuccessMessage(
        payload?.message ||
          tr('Password reset successful. You can now sign in.'),
      );
      setValidToken(true);

      window.setTimeout(() => {
        navigate('/auth/signin', {
          replace: true,
          state: {
            message: tr(
              'Password reset successful. Sign in with your new password.',
            ),
          },
        });
      }, 1200);
    } catch (submitError) {
      setValidToken(false);
      setError(
        submitError.message || tr('Unable to reset password right now.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title={tr('Reset Password')}
      subtitle={tr('Choose a new password for your OgaDoctor account.')}
      highlights={['Profile', 'Reports & Records', 'Schedule']}
      footer={
        <p className="text-sm text-slate-600">
          <Link
            to="/auth/forgot-password"
            className="font-semibold text-sky-700 transition hover:text-cyan-600"
          >
            {tr('Request a new reset link')}
          </Link>
        </p>
      }
    >
      {checking ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {tr('Checking reset link...')}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          {!initialToken && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {tr('Reset token')}
              </span>
              <input
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder={tr('Paste your reset token')}
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {tr('New Password')}
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              placeholder={tr('Enter your new password')}
              disabled={!validToken && Boolean(initialToken)}
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {tr('Confirm Password')}
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              placeholder={tr('Confirm your new password')}
              disabled={!validToken && Boolean(initialToken)}
            />
          </label>

          <AuthStatusMessage variant="danger">{error}</AuthStatusMessage>

          <AuthStatusMessage variant="success">
            {successMessage}
          </AuthStatusMessage>

          <button
            type="submit"
            disabled={submitting || (Boolean(initialToken) && !validToken)}
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
            {submitting ? tr('Resetting password...') : tr('Reset Password')}
          </button>
        </form>
      )}
    </AuthPageShell>
  );
}
