import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  clearStoredFormDraft,
  getRememberedUser,
  getStoredFormDraft,
  saveStoredFormDraft,
} from '../../lib/session';
import { useLanguage } from '../../context/LanguageContext';
import AuthPageShell from '../../components/auth/AuthPageShell';
import AuthRoleTabs from '../../components/auth/AuthRoleTabs';
import AuthStatusMessage from '../../components/auth/AuthStatusMessage';
import {
  getAuthRoute,
  getDefaultAppRoute,
  normalizeAccountType,
} from '../../lib/account';

const CONTENT = {
  patient: {
    title: 'Sign In',
    subtitle: 'Access your appointments, reports, and consultations.',
    highlights: ['Doctor Messages', 'Schedule', 'Reports & Records'],
    accessLabel: 'Secure patient access',
    heroEyebrow: 'Healthcare in Your Pocket',
    heroTitle:
      'Trusted healthcare access designed for clarity, speed, and confidence.',
    heroBody:
      'Manage consultations, messages, appointments, and recovery flows in one calm, secure place.',
  },
  doctor: {
    title: 'Doctor Sign In',
    subtitle:
      'Access your patient inbox, consultation room, and doctor profile.',
    highlights: ['Patient Messages', 'Video Consultation', 'Profile'],
    accessLabel: 'Secure doctor access',
    heroEyebrow: 'Your Clinical Workspace',
    heroTitle:
      'Stay close to patient conversations, video sessions, and practice updates.',
    heroBody:
      'Use one secure workspace to respond to patients, join consultations, and manage your doctor profile.',
  },
};

export default function SignInPage({ accountType = 'patient' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { tr } = useLanguage();
  const activeAccountType = normalizeAccountType(accountType, 'patient');
  const content = CONTENT[activeAccountType];

  const [form, setForm] = useState(() => {
    const rememberedUser = getRememberedUser() || {};
    const draft = getStoredFormDraft(`signin_${activeAccountType}`, {});
    return {
      email: draft.email || rememberedUser.email || '',
      password: '',
    };
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const notice = useMemo(() => location.state?.message || '', [location.state]);

  const redirectPath = useMemo(() => {
    if (location.state?.from) return location.state.from;
    return '/app/dashboard';
  }, [location.state]);

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  useEffect(() => {
    saveStoredFormDraft(`signin_${activeAccountType}`, {
      email: form.email,
    });
  }, [activeAccountType, form.email]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError(tr('Email and password are required.'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = await signIn({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        accountType: activeAccountType,
      });
      clearStoredFormDraft(`signin_${activeAccountType}`);

      const nextRoute =
        location.state?.from && payload?.user?.accountType !== 'doctor'
          ? redirectPath
          : getDefaultAppRoute(payload?.user);

      navigate(nextRoute, { replace: true });
    } catch (submitError) {
      setError(submitError.message || tr('Unable to sign in right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title={tr(content.title)}
      subtitle={tr(content.subtitle)}
      highlights={content.highlights}
      accessLabel={tr(content.accessLabel)}
      heroEyebrow={tr(content.heroEyebrow)}
      heroTitle={tr(content.heroTitle)}
      heroBody={tr(content.heroBody)}
      footer={
        <p className="text-sm text-slate-600">
          {tr('New to OgaDoctor?')}{' '}
          <Link
            to={getAuthRoute(activeAccountType, 'signup')}
            className="font-semibold text-sky-700 transition hover:text-cyan-600"
          >
            {tr('Create Account')}
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthRoleTabs accountType={activeAccountType} mode="signin" />

        <AuthStatusMessage variant="info">{notice}</AuthStatusMessage>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {tr('Email address')}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={onChange('email')}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder={tr('you@example.com')}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {tr('Password')}
          </span>
          <input
            type="password"
            value={form.password}
            onChange={onChange('password')}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder={tr('Your password')}
          />
        </label>

        <div className="flex justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
            state={{ accountType: activeAccountType }}
          >
            {tr('Forgot password?')}
          </Link>
        </div>

        <AuthStatusMessage variant="danger">{error}</AuthStatusMessage>

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
          {submitting ? tr('Signing in...') : tr('Sign In')}
        </button>
      </form>
    </AuthPageShell>
  );
}
