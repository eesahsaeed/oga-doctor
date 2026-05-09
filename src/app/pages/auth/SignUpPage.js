import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const DOCTOR_TITLE_OPTIONS = [
  'General Practitioner',
  'Primary Care Doctor',
  'Family Physician',
  'Medical Officer',
  'Resident Doctor',
  'Consultant Specialist',
];

function normalizeDoctorTitle(value = '') {
  return DOCTOR_TITLE_OPTIONS.includes(value) ? value : '';
}

function inferSpecialistFromTitle(value = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized.includes('consultant') || normalized.includes('specialist');
}

function SpecialistToggle({ checked, onChange, tr }) {
  const inputId = useId();

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onChange(!checked);
        }
      }}
      className="relative z-10 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
      style={{
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
      }}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        onClick={(event) => event.stopPropagation()}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300"
        style={{ accentColor: '#0f172a' }}
      />
      <label
        htmlFor={inputId}
        className="block cursor-pointer"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="block text-sm font-semibold text-slate-900">
          {tr('I mainly offer specialist care')}
        </span>
        <span className="mt-1 block text-sm text-slate-500">
          {tr(
            'Turn this on if patients should discover this doctor account under specialists.',
          )}
        </span>
      </label>
    </div>
  );
}

const CONTENT = {
  patient: {
    title: 'Create Account',
    subtitle: 'Start consultations, scheduling, and health tracking.',
    highlights: ['Doctors', 'AI Consultation', 'Video Consultation'],
    accessLabel: 'Secure patient access',
    heroEyebrow: 'Personal Care Starts Here',
    heroTitle:
      'Create your patient account and keep every care step in one place.',
    heroBody:
      'Book consultations, message doctors, review reports, and keep your health history close by.',
  },
  doctor: {
    title: 'Doctor Sign Up',
    subtitle:
      'Activate your doctor account for patient chat, video visits, and profile management.',
    highlights: ['Patient Messages', 'Video Consultation', 'Profile'],
    accessLabel: 'Secure doctor access',
    heroEyebrow: 'Join the Care Network',
    heroTitle:
      'Set up your doctor account and start receiving patient consultations.',
    heroBody:
      'Create a secure doctor login for direct patient replies, consultation sessions, and practice visibility.',
  },
};

export default function SignUpPage({ accountType = 'patient' }) {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { tr } = useLanguage();
  const activeAccountType = normalizeAccountType(accountType, 'patient');
  const isDoctor = activeAccountType === 'doctor';
  const content = CONTENT[activeAccountType];

  const [form, setForm] = useState(() => {
    const rememberedUser = getRememberedUser() || {};
    const draft = getStoredFormDraft(`signup_${activeAccountType}`, {});
    return {
      name: draft.name || rememberedUser.name || '',
      email: draft.email || rememberedUser.email || '',
      title: normalizeDoctorTitle(draft.title),
      specialty: draft.specialty || '',
      isSpecialist:
        typeof draft.isSpecialist === 'boolean'
          ? draft.isSpecialist
          : inferSpecialistFromTitle(draft.title),
      password: '',
      confirmPassword: '',
    };
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  useEffect(() => {
    saveStoredFormDraft(`signup_${activeAccountType}`, {
      name: form.name,
      email: form.email,
      title: form.title,
      specialty: form.specialty,
      isSpecialist: form.isSpecialist,
    });
  }, [
    activeAccountType,
    form.email,
    form.isSpecialist,
    form.name,
    form.specialty,
    form.title,
  ]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError(tr('Full name is required.'));
      return;
    }

    if (!form.email.trim()) {
      setError(tr('Email is required.'));
      return;
    }

    if (isDoctor && !form.title.trim()) {
      setError(tr('Professional title is required.'));
      return;
    }

    if (isDoctor && !form.specialty.trim()) {
      setError(tr('Specialty is required.'));
      return;
    }

    if (form.password.length < 6) {
      setError(tr('Password must be at least 6 characters long.'));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(tr('Passwords do not match.'));
      return;
    }

    setSubmitting(true);

    try {
      const response = await signUp({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        accountType: activeAccountType,
        title: form.title.trim(),
        specialty: form.specialty.trim(),
        isSpecialist: form.isSpecialist,
        password: form.password,
      });
      clearStoredFormDraft(`signup_${activeAccountType}`);

      navigate(getDefaultAppRoute(response?.user), { replace: true });
    } catch (submitError) {
      setError(
        submitError.message || tr('Unable to create account right now.'),
      );
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
          {tr('Already have an account?')}{' '}
          <Link
            to={getAuthRoute(activeAccountType, 'signin')}
            className="font-semibold text-cyan-600 transition hover:text-cyan-700"
          >
            {tr('Sign In')}
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthRoleTabs accountType={activeAccountType} mode="signup" />

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {tr('Full name')}
          </span>
          <input
            type="text"
            value={form.name}
            onChange={onChange('name')}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder={tr('John Doe')}
          />
        </label>

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

        {isDoctor && (
          <>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {tr('Professional title')}
              </span>
              <select
                value={form.title}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: nextTitle,
                    isSpecialist:
                      prev.isSpecialist || inferSpecialistFromTitle(nextTitle),
                  }));
                }}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              >
                <option value="">{tr('Select professional title')}</option>
                {DOCTOR_TITLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {tr(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {tr('Specialty')}
              </span>
              <input
                type="text"
                value={form.specialty}
                onChange={onChange('specialty')}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder={tr('General Medicine')}
              />
            </label>

            <SpecialistToggle
              checked={form.isSpecialist}
              onChange={(nextChecked) =>
                setForm((prev) => ({
                  ...prev,
                  isSpecialist: nextChecked,
                }))
              }
              tr={tr}
            />
          </>
        )}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {tr('Password')}
          </span>
          <input
            type="password"
            value={form.password}
            onChange={onChange('password')}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder={tr('At least 6 characters')}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {tr('Confirm Password')}
          </span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={onChange('confirmPassword')}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder={tr('Repeat your password')}
          />
        </label>

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
          {submitting ? tr('Creating account...') : tr('Create Account')}
        </button>
      </form>
    </AuthPageShell>
  );
}
