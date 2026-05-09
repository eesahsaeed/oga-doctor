import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { normalizeLanguage } from '../../lib/i18n';
import { buildNameAvatarDataUrl } from '../../lib/nameAvatar';
import { apiClient } from '../../lib/api';
import {
  clearStoredFormDraft,
  getStoredFormDraft,
  saveStoredFormDraft,
} from '../../lib/session';

const DRAFT_KEY = 'doctor_onboarding';
const MAX_AVATAR_BYTES = 230 * 1024;

const TITLE_OPTIONS = [
  'General Practitioner',
  'Primary Care Doctor',
  'Family Physician',
  'Medical Officer',
  'Resident Doctor',
  'Consultant Specialist',
  'Consultant Pediatrician',
  'Consultant Cardiologist',
  'Consultant Gynecologist',
  'Consultant Psychiatrist',
];

const SPECIALTY_OPTIONS = [
  'General Medicine',
  'Internal Medicine',
  'Family Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Orthopedics',
];

const RESPONSE_TIME_OPTIONS = [
  'Replies in about 5 mins',
  'Replies in about 10 mins',
  'Replies in about 15 mins',
  'Usually responds within 30 minutes',
  'Usually responds within 1 hour',
];

const CONSULTATION_MODE_OPTIONS = [
  { value: 'doctor_chat', label: 'Doctor chat' },
  { value: 'video', label: 'Video' },
  { value: 'in_person', label: 'In-person' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
];

function normalizeLanguageCodes(values = [], fallback = 'en') {
  const rawValues = Array.isArray(values)
    ? values
    : typeof values === 'string'
      ? values.split(',')
      : [];

  const codes = rawValues
    .map((entry) => normalizeLanguage(entry))
    .filter(Boolean);

  if (codes.length === 0) {
    return [normalizeLanguage(fallback)];
  }

  return [...new Set(codes)];
}

function buildForm(user = {}, draft = {}, fallbackLanguage = 'en') {
  const language = normalizeLanguage(
    draft.language || user?.onboarding?.language || fallbackLanguage,
  );

  return {
    language,
    avatar: draft.avatar ?? user?.avatar ?? '',
    name: draft.name ?? user?.name ?? '',
    title: draft.title ?? user?.title ?? TITLE_OPTIONS[0],
    specialty: draft.specialty ?? user?.specialty ?? SPECIALTY_OPTIONS[0],
    bio: draft.bio ?? user?.bio ?? '',
    isSpecialist:
      typeof draft.isSpecialist === 'boolean'
        ? draft.isSpecialist
        : Boolean(user?.isSpecialist),
    yearsExperience:
      draft.yearsExperience ?? String(user?.yearsExperience ?? ''),
    responseTime:
      draft.responseTime ??
      user?.responseTime ??
      'Usually responds within 30 minutes',
    nextAvailable:
      draft.nextAvailable ?? user?.nextAvailable ?? 'Today, 4:00 PM',
    priceLabel: draft.priceLabel ?? user?.priceLabel ?? 'From NGN 10,000',
    status: draft.status ?? user?.status ?? 'available',
    languages:
      draft.languages ??
      normalizeLanguageCodes(
        user?.languages,
        user?.onboarding?.language || language,
      ),
    consultationModes:
      draft.consultationModes ??
      (Array.isArray(user?.consultationModes) &&
      user.consultationModes.length > 0
        ? user.consultationModes
        : ['doctor_chat', 'video']),
    profile: {
      phone: draft.profile?.phone ?? user?.profile?.phone ?? '',
      practiceAddress:
        draft.profile?.practiceAddress ?? user?.profile?.practiceAddress ?? '',
      licenseNumber:
        draft.profile?.licenseNumber ?? user?.profile?.licenseNumber ?? '',
      consultationFocus:
        draft.profile?.consultationFocus ??
        user?.profile?.consultationFocus ??
        '',
    },
  };
}

function dataUrlSizeInBytes(dataUrl = '') {
  const [, base64 = ''] = String(dataUrl || '').split(',');
  return Math.floor((base64.length * 3) / 4);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read selected image.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('Unable to process selected image.'));
    image.src = source;
  });
}

async function buildAvatarDataUrl(file) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Select a valid image file.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(rawDataUrl);
  const maxDimension = 520;
  const ratio = Math.min(
    1,
    maxDimension /
      Math.max(image.width || maxDimension, image.height || maxDimension),
  );
  const width = Math.max(1, Math.round((image.width || maxDimension) * ratio));
  const height = Math.max(
    1,
    Math.round((image.height || maxDimension) * ratio),
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Image processing is not available on this browser.');
  }

  context.drawImage(image, 0, 0, width, height);

  const qualitySteps = [0.9, 0.82, 0.72, 0.62, 0.5];
  for (const quality of qualitySteps) {
    const output = canvas.toDataURL('image/jpeg', quality);
    if (dataUrlSizeInBytes(output) <= MAX_AVATAR_BYTES) {
      return output;
    }
  }

  throw new Error(
    'Use a smaller image. The profile photo must stay under 230KB.',
  );
}

function toggleArrayValue(list = [], value = '') {
  return list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
}

function normalizeDigitsOnly(value = '') {
  return String(value || '').replace(/\D+/g, '');
}

function isInlineImageDataUrl(value = '') {
  return /^data:image\//i.test(String(value || '').trim());
}

export default function DoctorOnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { tr, languages, setLanguage } = useLanguage();

  const [form, setForm] = useState(() =>
    buildForm(
      user,
      getStoredFormDraft(DRAFT_KEY, {}),
      user?.onboarding?.language,
    ),
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const avatarPreviewSrc = useMemo(
    () => form.avatar || buildNameAvatarDataUrl(form.name || 'Doctor'),
    [form.avatar, form.name],
  );

  const readinessItems = useMemo(
    () => [
      {
        label: tr('Profile image or name avatar ready'),
        done: Boolean(form.avatar || form.name.trim()),
      },
      {
        label: tr('Professional identity complete'),
        done: Boolean(
          form.name.trim() && form.title.trim() && form.specialty.trim(),
        ),
      },
      {
        label: tr('Practice details complete'),
        done: Boolean(
          form.bio.trim() &&
          form.profile.phone.trim() &&
          form.profile.licenseNumber.trim() &&
          form.profile.practiceAddress.trim(),
        ),
      },
      {
        label: tr('Consultation setup ready'),
        done: Boolean(
          form.languages.length > 0 &&
          form.consultationModes.length > 0 &&
          form.responseTime.trim() &&
          form.priceLabel.trim(),
        ),
      },
    ],
    [form, tr],
  );
  const completedReadinessItems = useMemo(
    () => readinessItems.filter((item) => item.done),
    [readinessItems],
  );
  const pendingReadinessItems = useMemo(
    () => readinessItems.filter((item) => !item.done),
    [readinessItems],
  );

  useEffect(() => {
    setForm(
      buildForm(
        user,
        getStoredFormDraft(DRAFT_KEY, {}),
        user?.onboarding?.language,
      ),
    );
  }, [user]);

  useEffect(() => {
    saveStoredFormDraft(DRAFT_KEY, form);
  }, [form]);

  const updateField = (field) => (event) => {
    const rawValue =
      event?.target?.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    const value =
      field === 'yearsExperience' ? normalizeDigitsOnly(rawValue) : rawValue;

    if (field === 'language') {
      void setLanguage(value);
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateProfileField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      profile: {
        ...(prev.profile || {}),
        [field]: event.target.value,
      },
    }));
  };

  const onToggleLanguage = (code) => {
    setForm((prev) => ({
      ...prev,
      languages: toggleArrayValue(prev.languages, code),
    }));
  };

  const onToggleMode = (mode) => {
    setForm((prev) => ({
      ...prev,
      consultationModes: toggleArrayValue(prev.consultationModes, mode),
    }));
  };

  const onAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingAvatar(true);
    setError('');

    try {
      const avatar = await buildAvatarDataUrl(file);
      setForm((prev) => ({ ...prev, avatar }));
      setStatus(tr('Profile image added.'));
    } catch (avatarError) {
      setError(
        avatarError.message || tr('Unable to use that image right now.'),
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setForm((prev) => ({ ...prev, avatar: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');

    if (!form.name.trim()) {
      setSaving(false);
      setError(tr('Full name is required.'));
      return;
    }

    if (!form.title.trim()) {
      setSaving(false);
      setError(tr('Professional title is required.'));
      return;
    }

    if (!form.specialty.trim()) {
      setSaving(false);
      setError(tr('Specialty is required.'));
      return;
    }

    if (!form.bio.trim()) {
      setSaving(false);
      setError(tr('Professional bio is required.'));
      return;
    }

    if (!form.profile.phone.trim()) {
      setSaving(false);
      setError(tr('Phone is required.'));
      return;
    }

    if (!form.profile.licenseNumber.trim()) {
      setSaving(false);
      setError(tr('License number is required.'));
      return;
    }

    if (!form.profile.practiceAddress.trim()) {
      setSaving(false);
      setError(tr('Practice address is required.'));
      return;
    }

    if (form.languages.length === 0) {
      setSaving(false);
      setError(tr('Select at least one spoken language.'));
      return;
    }

    if (form.consultationModes.length === 0) {
      setSaving(false);
      setError(tr('Select at least one consultation mode.'));
      return;
    }

    try {
      let avatarValue = form.avatar;
      if (isInlineImageDataUrl(avatarValue)) {
        const uploadResponse = await apiClient.uploadDoctorAvatar({
          imageDataUrl: avatarValue,
        });
        avatarValue = uploadResponse?.avatar || '';

        if (avatarValue) {
          setForm((prev) => ({ ...prev, avatar: avatarValue }));
        }
      }

      await apiClient.saveOnboarding({
        language: form.language,
        avatar: avatarValue,
        name: form.name.trim(),
        title: form.title.trim(),
        specialty: form.specialty.trim(),
        bio: form.bio.trim(),
        isSpecialist: form.isSpecialist,
        yearsExperience: Number(form.yearsExperience || 0),
        responseTime: form.responseTime.trim(),
        nextAvailable: form.nextAvailable.trim(),
        priceLabel: form.priceLabel.trim(),
        status: form.status,
        languages: form.languages,
        consultationModes: form.consultationModes,
        profile: {
          phone: form.profile.phone.trim(),
          practiceAddress: form.profile.practiceAddress.trim(),
          licenseNumber: form.profile.licenseNumber.trim(),
          consultationFocus: form.profile.consultationFocus.trim(),
        },
        onboardingCompleted: true,
      });

      clearStoredFormDraft(DRAFT_KEY);
      await refreshProfile();
      navigate('/app/dashboard', { replace: true });
    } catch (submitError) {
      setError(
        submitError.message ||
          tr('Unable to save doctor onboarding right now.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#eff6ff_30%,_#f8fafc_65%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">
                {tr('Doctor onboarding')}
              </p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                {tr('Build your care profile before patients discover you.')}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {tr(
                  'Add your profile image, specialist details, practice information, and consultation settings so your doctor card looks polished from day one.',
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {completedReadinessItems.length}/{readinessItems.length}{' '}
                  {tr('Ready')}
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {pendingReadinessItems.length} {tr('Pending')}
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {tr('Directory readiness')}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {tr(
                      'Completed steps and remaining items update live as you fill this form.',
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-emerald-700">
                      {tr('Ready')}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      {completedReadinessItems.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {completedReadinessItems.length > 0 ? (
                      completedReadinessItems.map((item) => (
                        <span
                          key={`ready-${item.label}`}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                            OK
                          </span>
                          {item.label}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
                        {tr('No completed steps yet.')}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-amber-700">
                      {tr('Pending')}
                    </p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                      {pendingReadinessItems.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingReadinessItems.length > 0 ? (
                      pendingReadinessItems.map((item) => (
                        <span
                          key={`pending-${item.label}`}
                          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                            !
                          </span>
                          {item.label}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700">
                        {tr('All steps are complete.')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {tr('Finish your doctor profile')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {tr(
                'The information you add here powers your specialist card, doctor inbox, and consultation visibility across OgaDoctor.',
              )}
            </p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Language')}
                </span>
                <select
                  value={form.language}
                  onChange={updateField('language')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.nativeLabel}
                    </option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Profile image')}
                </span>
                <div className="mt-1.5 flex flex-col gap-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <img
                    src={avatarPreviewSrc}
                    alt={tr('Doctor avatar preview')}
                    className="h-24 w-24 rounded-[26px] object-cover ring-2 ring-white"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {tr('Upload a clear professional headshot')}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {tr(
                        'You can upload a real photo now or skip it and we will use a polished initials avatar from your name.',
                      )}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label
                        className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        style={{
                          backgroundColor: '#0f172a',
                          border: '1.5px solid #0f172a',
                          color: '#ffffff',
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => void onAvatarChange(event)}
                        />
                        <span
                          style={{
                            color: '#ffffff',
                            display: 'inline-block',
                          }}
                        >
                          {uploadingAvatar
                            ? tr('Optimizing image...')
                            : form.avatar
                              ? tr('Replace image')
                              : tr('Upload image')}
                        </span>
                      </label>
                      {form.avatar && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          style={{
                            backgroundColor: '#ffffff',
                            borderColor: '#334155',
                            borderWidth: '1.5px',
                            color: '#0f172a',
                          }}
                        >
                          {tr('Remove image')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Full name')}
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={updateField('name')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr('Dr. Amina Yusuf')}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Professional title')}
                </span>
                <select
                  value={form.title}
                  onChange={updateField('title')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  {TITLE_OPTIONS.map((option) => (
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
                <select
                  value={form.specialty}
                  onChange={updateField('specialty')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  {SPECIALTY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {tr(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Years of experience')}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.yearsExperience}
                  onChange={updateField('yearsExperience')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder="8"
                />
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.isSpecialist)}
                  onChange={updateField('isSpecialist')}
                  style={{ accentColor: '#0f172a' }}
                />
                <span style={{ color: '#0f172a' }}>
                  {tr('Feature this profile as specialist care')}
                </span>
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Professional bio')}
                </span>
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={updateField('bio')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr(
                    'Describe your care experience, patient style, and the type of consultations you handle best.',
                  )}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Phone')}
                </span>
                <input
                  type="tel"
                  value={form.profile.phone}
                  onChange={updateProfileField('phone')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr('+234 801 234 5678')}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('License number')}
                </span>
                <input
                  type="text"
                  value={form.profile.licenseNumber}
                  onChange={updateProfileField('licenseNumber')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr('MDCN-XXXXXX')}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Practice address')}
                </span>
                <input
                  type="text"
                  value={form.profile.practiceAddress}
                  onChange={updateProfileField('practiceAddress')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr('Clinic or hospital address')}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Consultation focus')}
                </span>
                <textarea
                  rows={3}
                  value={form.profile.consultationFocus}
                  onChange={updateProfileField('consultationFocus')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr(
                    'List your most common cases, preferred patient groups, or follow-up strengths.',
                  )}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Reply Time')}
                </span>
                <select
                  value={form.responseTime}
                  onChange={updateField('responseTime')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  {RESPONSE_TIME_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {tr(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Next Available')}
                </span>
                <input
                  type="text"
                  value={form.nextAvailable}
                  onChange={updateField('nextAvailable')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr('Today, 6:15 PM')}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Consultation price')}
                </span>
                <input
                  type="text"
                  value={form.priceLabel}
                  onChange={updateField('priceLabel')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={tr('From NGN 16,000')}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Status')}
                </span>
                <select
                  value={form.status}
                  onChange={updateField('status')}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {tr(option.label)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Spoken languages')}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {languages.map((item) => {
                    const selected = form.languages.includes(item.code);
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => onToggleLanguage(item.code)}
                        className={[
                          'rounded-full px-4 py-2 text-sm font-semibold transition',
                          selected
                            ? 'border border-slate-900 bg-slate-900 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
                        ].join(' ')}
                        style={{
                          backgroundColor: selected ? '#0f172a' : '#ffffff',
                          borderColor: selected ? '#0f172a' : '#334155',
                          borderWidth: '1.5px',
                          color: selected ? '#ffffff' : '#0f172a',
                        }}
                      >
                        {item.nativeLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tr('Consultation modes')}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CONSULTATION_MODE_OPTIONS.map((item) => {
                    const selected = form.consultationModes.includes(
                      item.value,
                    );
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => onToggleMode(item.value)}
                        className={[
                          'rounded-full px-4 py-2 text-sm font-semibold transition',
                          selected
                            ? 'border border-sky-700 bg-sky-700 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
                        ].join(' ')}
                        style={{
                          backgroundColor: selected ? '#0c4a6e' : '#ffffff',
                          borderColor: selected ? '#0c4a6e' : '#334155',
                          borderWidth: '1.5px',
                          color: selected ? '#ffffff' : '#0f172a',
                        }}
                      >
                        {tr(item.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {status && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                {tr(
                  'Once saved, your doctor workspace will open and your profile can appear in patient discovery with either your uploaded photo or your initials avatar.',
                )}
              </p>
              <button
                type="submit"
                disabled={saving || uploadingAvatar}
                className="block w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: '#0f172a',
                  border: '1.5px solid #0f172a',
                  color: '#ffffff',
                }}
              >
                {saving ? tr('Saving...') : tr('Save and Enter Workspace')}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
