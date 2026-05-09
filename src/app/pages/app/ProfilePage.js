import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../lib/api';
import { buildNameAvatarDataUrl } from '../../lib/nameAvatar';
import {
  clearStoredFormDraft,
  getStoredFormDraft,
  saveStoredFormDraft,
} from '../../lib/session';
import { isDoctorUser } from '../../lib/account';

const defaultPatientProfile = {
  phone: '',
  dateOfBirth: '',
  bloodGroup: '',
  genotype: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  allergies: '',
  medications: '',
  heightCm: '',
  weightKg: '',
};

const defaultDoctorProfile = {
  phone: '',
  practiceAddress: '',
  licenseNumber: '',
  consultationFocus: '',
};

const MAX_AVATAR_BYTES = 230 * 1024;

function mergeFromPatientProfile(user = {}) {
  return {
    ...defaultPatientProfile,
    ...(user?.profile || {}),
  };
}

function formatCommaList(values = []) {
  return Array.isArray(values) ? values.join(', ') : '';
}

function parseCommaList(value = '') {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildDoctorForm(user = {}, draft = {}) {
  return {
    avatar: draft.avatar ?? user?.avatar ?? '',
    name: draft.name ?? user?.name ?? '',
    title: draft.title ?? user?.title ?? '',
    specialty: draft.specialty ?? user?.specialty ?? '',
    bio: draft.bio ?? user?.bio ?? '',
    isSpecialist:
      typeof draft.isSpecialist === 'boolean'
        ? draft.isSpecialist
        : Boolean(user?.isSpecialist),
    yearsExperience:
      draft.yearsExperience ?? String(user?.yearsExperience ?? ''),
    responseTime: draft.responseTime ?? user?.responseTime ?? '',
    nextAvailable: draft.nextAvailable ?? user?.nextAvailable ?? '',
    priceLabel: draft.priceLabel ?? user?.priceLabel ?? '',
    languages: draft.languages ?? formatCommaList(user?.languages),
    consultationModes:
      draft.consultationModes ?? formatCommaList(user?.consultationModes),
    profile: {
      ...defaultDoctorProfile,
      ...(user?.profile || {}),
      ...(draft.profile || {}),
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

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { tr, formatDate } = useLanguage();
  const isDoctor = isDoctorUser(user);
  const draftKey = isDoctor ? 'doctor_profile' : 'profile';

  const [name, setName] = useState(() => {
    const draft = getStoredFormDraft('profile', {});
    return draft.name ?? user?.name ?? '';
  });
  const [isPremium, setIsPremium] = useState(() => {
    const draft = getStoredFormDraft('profile', {});
    return typeof draft.isPremium === 'boolean'
      ? draft.isPremium
      : Boolean(user?.isPremium);
  });
  const [profile, setProfile] = useState(() => {
    const draft = getStoredFormDraft('profile', {});
    return {
      ...mergeFromPatientProfile(user),
      ...(draft.profile || {}),
    };
  });
  const [doctorForm, setDoctorForm] = useState(() =>
    buildDoctorForm(user, getStoredFormDraft('doctor_profile', {})),
  );
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const doctorAvatarPreview = useMemo(
    () =>
      doctorForm.avatar || buildNameAvatarDataUrl(doctorForm.name || 'Doctor'),
    [doctorForm.avatar, doctorForm.name],
  );

  const onboardingItems = useMemo(() => {
    const onboarding = user?.onboarding || {};
    return [
      {
        label: tr('Gender'),
        value: onboarding.gender
          ? tr(onboarding.gender === 'male' ? 'Male' : 'Female')
          : tr('N/A'),
      },
      { label: tr('Age'), value: onboarding.age || tr('N/A') },
      { label: tr('Language'), value: onboarding.language || 'en' },
      {
        label: tr('Consultation preference'),
        value: tr(
          onboarding.subHealthCategory === 'doctor_chat'
            ? 'Chat with a Doctor'
            : onboarding.subHealthCategory === 'specialist_doctor'
              ? 'Consult a Specialist Doctor'
              : onboarding.subHealthCategory === 'chat'
                ? 'AI Chat with Aisha'
                : onboarding.subHealthCategory === 'video'
                  ? 'Video Consultation'
                  : onboarding.subHealthCategory === 'in_person'
                    ? 'In-Person'
                    : 'AI Chat with Aisha',
        ),
      },
      {
        label: tr("Women's Stage"),
        value: tr(
          onboarding.womensStage === 'trying_to_conceive'
            ? 'Trying to Conceive'
            : onboarding.womensStage === 'pregnant'
              ? 'Pregnant'
              : onboarding.womensStage === 'postpartum'
                ? 'Postpartum'
                : 'General',
        ),
      },
      {
        label: tr('Conditions'),
        value: onboarding.conditions || tr('No conditions added'),
      },
    ];
  }, [tr, user?.onboarding]);

  useEffect(() => {
    const draft = getStoredFormDraft('profile', {});
    setName(draft.name ?? user?.name ?? '');
    setIsPremium(
      typeof draft.isPremium === 'boolean'
        ? draft.isPremium
        : Boolean(user?.isPremium),
    );
    setProfile({
      ...mergeFromPatientProfile(user),
      ...(draft.profile || {}),
    });
  }, [user]);

  useEffect(() => {
    setDoctorForm(
      buildDoctorForm(user, getStoredFormDraft('doctor_profile', {})),
    );
  }, [user]);

  useEffect(() => {
    if (isDoctor) {
      saveStoredFormDraft(draftKey, doctorForm);
      return;
    }

    saveStoredFormDraft(draftKey, {
      name,
      isPremium,
      profile,
    });
  }, [doctorForm, draftKey, isDoctor, isPremium, name, profile]);

  const updatePatientProfileField = (field) => (event) => {
    setProfile((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const updateDoctorField = (field) => (event) => {
    const value =
      event?.target?.type === 'checkbox'
        ? event.target.checked
        : event.target.value;

    setDoctorForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateDoctorProfileField = (field) => (event) => {
    setDoctorForm((prev) => ({
      ...prev,
      profile: {
        ...(prev.profile || {}),
        [field]: event.target.value,
      },
    }));
  };

  const uploadDoctorProfileImage = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || uploadingAvatar) {
      return;
    }

    setUploadingAvatar(true);
    setStatus('');

    try {
      const imageDataUrl = await buildAvatarDataUrl(file);
      const payload = await apiClient.uploadDoctorAvatar({ imageDataUrl });
      const nextAvatar = payload?.user?.avatar || payload?.avatar || '';

      if (!nextAvatar) {
        throw new Error(tr('Failed to update profile picture.'));
      }

      setDoctorForm((prev) => {
        const nextForm = { ...prev, avatar: nextAvatar };
        saveStoredFormDraft('doctor_profile', nextForm);
        return nextForm;
      });

      await refreshProfile();
      setStatus(tr('Profile picture updated successfully.'));
    } catch (error) {
      setStatus(error.message || tr('Failed to update profile picture.'));
    } finally {
      setUploadingAvatar(false);
      if (event?.target) {
        event.target.value = '';
      }
    }
  };

  const savePatientProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      await apiClient.updateProfile({
        name: name.trim(),
        isPremium,
        profile,
      });
      clearStoredFormDraft('profile');
      await refreshProfile();
      setStatus(tr('Profile updated successfully.'));
    } catch (error) {
      setStatus(error.message || tr('Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const saveDoctorProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      await apiClient.updateProfile({
        name: doctorForm.name.trim(),
        title: doctorForm.title.trim(),
        specialty: doctorForm.specialty.trim(),
        bio: doctorForm.bio.trim(),
        isSpecialist: doctorForm.isSpecialist,
        yearsExperience: Number(doctorForm.yearsExperience || 0),
        responseTime: doctorForm.responseTime.trim(),
        nextAvailable: doctorForm.nextAvailable.trim(),
        priceLabel: doctorForm.priceLabel.trim(),
        languages: parseCommaList(doctorForm.languages),
        consultationModes: parseCommaList(doctorForm.consultationModes).map(
          (entry) => entry.toLowerCase().replaceAll(' ', '_'),
        ),
        profile: doctorForm.profile,
      });
      clearStoredFormDraft('doctor_profile');
      await refreshProfile();
      setStatus(tr('Profile updated successfully.'));
    } catch (error) {
      setStatus(error.message || tr('Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (isDoctor) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h1 className="text-2xl font-bold text-slate-900">{tr('Profile')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tr(
              'Manage your doctor identity, patient-facing availability, and practice details.',
            )}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{tr('Account Email')}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {user?.email || tr('N/A')}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{tr('Specialty')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {tr(user?.specialty || 'General Medicine')}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{tr('Joined')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {user?.createdAt ? formatDate(user.createdAt) : tr('N/A')}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{tr('Last Updated')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {user?.updatedAt ? formatDate(user.updatedAt) : tr('N/A')}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <form onSubmit={saveDoctorProfile} className="space-y-5">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={doctorAvatarPreview}
                  alt={tr('Doctor avatar preview')}
                  className="h-24 w-24 rounded-[24px] object-cover ring-2 ring-white"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {tr('Profile image')}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {tr(
                      'Upload a new professional photo here. Your previous cloud image will be replaced automatically.',
                    )}
                  </p>
                  <div className="mt-3">
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
                        onChange={(event) =>
                          void uploadDoctorProfileImage(event)
                        }
                      />
                      <span style={{ color: '#ffffff' }}>
                        {uploadingAvatar
                          ? tr('Optimizing image...')
                          : tr('Change profile picture')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Full name')}
                </span>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={updateDoctorField('name')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Professional title')}
                </span>
                <input
                  type="text"
                  value={doctorForm.title}
                  onChange={updateDoctorField('title')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  placeholder={tr('Doctor')}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Specialty')}
                </span>
                <input
                  type="text"
                  value={doctorForm.specialty}
                  onChange={updateDoctorField('specialty')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  placeholder={tr('General Medicine')}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Years of experience')}
                </span>
                <input
                  type="number"
                  min="0"
                  value={doctorForm.yearsExperience}
                  onChange={updateDoctorField('yearsExperience')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Reply Time')}
                </span>
                <input
                  type="text"
                  value={doctorForm.responseTime}
                  onChange={updateDoctorField('responseTime')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  placeholder={tr('Usually responds within 30 minutes')}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Next Available')}
                </span>
                <input
                  type="text"
                  value={doctorForm.nextAvailable}
                  onChange={updateDoctorField('nextAvailable')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  placeholder={tr('Today')}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Phone')}
                </span>
                <input
                  type="tel"
                  value={doctorForm.profile.phone}
                  onChange={updateDoctorProfileField('phone')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Practice address')}
                </span>
                <input
                  type="text"
                  value={doctorForm.profile.practiceAddress}
                  onChange={updateDoctorProfileField('practiceAddress')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('License number')}
                </span>
                <input
                  type="text"
                  value={doctorForm.profile.licenseNumber}
                  onChange={updateDoctorProfileField('licenseNumber')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Price label')}
                </span>
                <input
                  type="text"
                  value={doctorForm.priceLabel}
                  onChange={updateDoctorField('priceLabel')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Languages')}
                </span>
                <input
                  type="text"
                  value={doctorForm.languages}
                  onChange={updateDoctorField('languages')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  placeholder={tr('English, Hausa')}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Consultation modes')}
                </span>
                <input
                  type="text"
                  value={doctorForm.consultationModes}
                  onChange={updateDoctorField('consultationModes')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  placeholder={tr('doctor chat, video')}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Consultation focus')}
                </span>
                <textarea
                  value={doctorForm.profile.consultationFocus}
                  onChange={updateDoctorProfileField('consultationFocus')}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  {tr('Bio')}
                </span>
                <textarea
                  value={doctorForm.bio}
                  onChange={updateDoctorField('bio')}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={doctorForm.isSpecialist}
                onChange={updateDoctorField('isSpecialist')}
              />
              {tr('This is a specialist account')}
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
              >
                {saving ? tr('Saving...') : tr('Save Changes')}
              </button>
              {status && <p className="text-sm text-slate-600">{status}</p>}
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-bold text-slate-900">{tr('Profile')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {tr(
            'Manage personal, emergency, and medical profile details across web and mobile.',
          )}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr('Account Email')}</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {user?.email || tr('N/A')}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr('Membership')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {isPremium ? tr('Premium') : tr('Standard')}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr('Joined')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {user?.createdAt ? formatDate(user.createdAt) : tr('N/A')}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr('Last Updated')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {user?.updatedAt ? formatDate(user.updatedAt) : tr('N/A')}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {tr('Health Onboarding Summary')}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {onboardingItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-sm font-medium text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form onSubmit={savePatientProfile} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Full name')}
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Phone')}
              </span>
              <input
                type="tel"
                value={profile.phone}
                onChange={updatePatientProfileField('phone')}
                placeholder="+234..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Date of birth')}
              </span>
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={updatePatientProfileField('dateOfBirth')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Address')}
              </span>
              <input
                type="text"
                value={profile.address}
                onChange={updatePatientProfileField('address')}
                placeholder={tr('City, State')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Blood group')}
              </span>
              <select
                value={profile.bloodGroup}
                onChange={updatePatientProfileField('bloodGroup')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">{tr('Select blood group')}</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Genotype')}
              </span>
              <select
                value={profile.genotype}
                onChange={updatePatientProfileField('genotype')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">{tr('Select genotype')}</option>
                <option value="AA">AA</option>
                <option value="AS">AS</option>
                <option value="SS">SS</option>
                <option value="AC">AC</option>
                <option value="SC">SC</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Height (cm)')}
              </span>
              <input
                type="number"
                value={profile.heightCm}
                onChange={updatePatientProfileField('heightCm')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="172"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Weight (kg)')}
              </span>
              <input
                type="number"
                value={profile.weightKg}
                onChange={updatePatientProfileField('weightKg')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="78"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Emergency contact name')}
              </span>
              <input
                type="text"
                value={profile.emergencyContactName}
                onChange={updatePatientProfileField('emergencyContactName')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {tr('Emergency contact phone')}
              </span>
              <input
                type="tel"
                value={profile.emergencyContactPhone}
                onChange={updatePatientProfileField('emergencyContactPhone')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                {tr('Allergies')}
              </span>
              <textarea
                value={profile.allergies}
                onChange={updatePatientProfileField('allergies')}
                rows={3}
                placeholder={tr('Penicillin, peanuts')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                {tr('Current medications')}
              </span>
              <textarea
                value={profile.medications}
                onChange={updatePatientProfileField('medications')}
                rows={3}
                placeholder={tr('Current medications')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(event) => setIsPremium(event.target.checked)}
            />
            {tr('Premium membership')}
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            >
              {saving ? tr('Saving...') : tr('Save Changes')}
            </button>
            {status && <p className="text-sm text-slate-600">{status}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}
