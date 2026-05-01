import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/api';
import {
  clearStoredFormDraft,
  getStoredFormDraft,
  saveStoredFormDraft,
} from '../../lib/session';

const defaultProfileDetails = {
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

function mergeFromUserProfile(user = {}) {
  return {
    ...defaultProfileDetails,
    ...(user?.profile || {}),
  };
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
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
      ...mergeFromUserProfile(user),
      ...(draft.profile || {}),
    };
  });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const onboardingItems = useMemo(() => {
    const onboarding = user?.onboarding || {};
    return [
      { label: 'Gender', value: onboarding.gender || 'N/A' },
      { label: 'Age', value: onboarding.age || 'N/A' },
      { label: 'Language', value: onboarding.language || 'en' },
      {
        label: 'Consultation preference',
        value: onboarding.subHealthCategory || 'chat',
      },
      {
        label: "Women's stage",
        value: onboarding.womensStage || 'general',
      },
      {
        label: 'Conditions',
        value: onboarding.conditions || 'No conditions added',
      },
    ];
  }, [user?.onboarding]);

  useEffect(() => {
    const draft = getStoredFormDraft('profile', {});
    setName(draft.name ?? user?.name ?? '');
    setIsPremium(
      typeof draft.isPremium === 'boolean'
        ? draft.isPremium
        : Boolean(user?.isPremium),
    );
    setProfile({
      ...mergeFromUserProfile(user),
      ...(draft.profile || {}),
    });
  }, [user]);

  useEffect(() => {
    saveStoredFormDraft('profile', {
      name,
      isPremium,
      profile,
    });
  }, [name, isPremium, profile]);

  const updateProfileField = (field) => (event) => {
    setProfile((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const saveProfile = async (event) => {
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
      setStatus('Profile updated successfully.');
    } catch (error) {
      setStatus(error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage personal, emergency, and medical profile details across web and
          mobile.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Account Email</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {user?.email || 'N/A'}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Membership</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {isPremium ? 'Premium' : 'Standard'}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Joined</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatDate(user?.createdAt)}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Last Updated</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatDate(user?.updatedAt)}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Health Onboarding Summary
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
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Full name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                type="tel"
                value={profile.phone}
                onChange={updateProfileField('phone')}
                placeholder="+234..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Date of birth
              </span>
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={updateProfileField('dateOfBirth')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Address
              </span>
              <input
                type="text"
                value={profile.address}
                onChange={updateProfileField('address')}
                placeholder="City, State"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Blood group
              </span>
              <select
                value={profile.bloodGroup}
                onChange={updateProfileField('bloodGroup')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">Select blood group</option>
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
                Genotype
              </span>
              <select
                value={profile.genotype}
                onChange={updateProfileField('genotype')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">Select genotype</option>
                <option value="AA">AA</option>
                <option value="AS">AS</option>
                <option value="SS">SS</option>
                <option value="AC">AC</option>
                <option value="SC">SC</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Height (cm)
              </span>
              <input
                type="number"
                value={profile.heightCm}
                onChange={updateProfileField('heightCm')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="e.g. 172"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Weight (kg)
              </span>
              <input
                type="number"
                value={profile.weightKg}
                onChange={updateProfileField('weightKg')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="e.g. 78"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Emergency contact name
              </span>
              <input
                type="text"
                value={profile.emergencyContactName}
                onChange={updateProfileField('emergencyContactName')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Emergency contact phone
              </span>
              <input
                type="tel"
                value={profile.emergencyContactPhone}
                onChange={updateProfileField('emergencyContactPhone')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Allergies
              </span>
              <textarea
                value={profile.allergies}
                onChange={updateProfileField('allergies')}
                rows={3}
                placeholder="e.g. Penicillin, peanuts"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Current medications
              </span>
              <textarea
                value={profile.medications}
                onChange={updateProfileField('medications')}
                rows={3}
                placeholder="Add regular medication details"
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
            Premium membership
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {status && <p className="text-sm text-slate-600">{status}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}
