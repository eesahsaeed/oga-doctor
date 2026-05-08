import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../lib/api';
import {
  clearStoredFormDraft,
  getStoredFormDraft,
  isOnboardingDone,
  saveStoredFormDraft,
} from '../../lib/session';

const defaultForm = {
  language: 'en',
  gender: '',
  age: '',
  mainHealthCategory: 'general',
  subHealthCategory: 'doctor_chat',
  womensStage: 'general',
  pregnancyWeeks: '',
  isFirstPregnancy: true,
  conditions: '',
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { tr, languages, setLanguage } = useLanguage();

  const [form, setForm] = useState(() => ({
    ...defaultForm,
    ...(user?.onboarding || {}),
    ...getStoredFormDraft('onboarding', {}),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const done = useMemo(() => isOnboardingDone(user), [user]);

  const onChange = (field) => (event) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    if (field === 'language') {
      void setLanguage(value);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    saveStoredFormDraft('onboarding', form);
  }, [form]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiClient.saveOnboarding({
        ...form,
        onboardingCompleted: true,
      });
      clearStoredFormDraft('onboarding');
      await refreshProfile();
      navigate('/app/dashboard', { replace: true });
    } catch (submitError) {
      setError(
        submitError.message || tr('Unable to save onboarding right now.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {tr('Complete Your Onboarding')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {tr('We use this to personalize consultations and recommendations.')}
        </p>

        {done && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {tr(
              'You already completed onboarding. You can still update it below.',
            )}
          </div>
        )}

        <form
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={onSubmit}
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {tr('Language')}
            </span>
            <select
              value={form.language}
              onChange={onChange('language')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.nativeLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {tr('Gender')}
            </span>
            <select
              value={form.gender}
              onChange={onChange('gender')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">{tr('Select')}</option>
              <option value="male">{tr('Male')}</option>
              <option value="female">{tr('Female')}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {tr('Age')}
            </span>
            <input
              type="number"
              value={form.age}
              onChange={onChange('age')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              placeholder="34"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {tr('Main Health Focus')}
            </span>
            <select
              value={form.mainHealthCategory}
              onChange={onChange('mainHealthCategory')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="general">{tr('General Health')}</option>
              <option value="womens-health">{tr("Women's Health")}</option>
              <option value="mental-health">{tr('Mental Health')}</option>
              <option value="cardiology">{tr('Cardiology')}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {tr('Consultation Preference')}
            </span>
            <select
              value={form.subHealthCategory}
              onChange={onChange('subHealthCategory')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="doctor_chat">{tr('Chat with a Doctor')}</option>
              <option value="specialist_doctor">
                {tr('Consult a Specialist Doctor')}
              </option>
              <option value="chat">{tr('AI Chat with Aisha')}</option>
              <option value="video">{tr('Video Consultation')}</option>
              <option value="in_person">{tr('In-Person')}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {tr("Women's Stage")}
            </span>
            <select
              value={form.womensStage}
              onChange={onChange('womensStage')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="general">{tr('General')}</option>
              <option value="trying_to_conceive">
                {tr('Trying to Conceive')}
              </option>
              <option value="pregnant">{tr('Pregnant')}</option>
              <option value="postpartum">{tr('Postpartum')}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {tr('Pregnancy Weeks (if relevant)')}
            </span>
            <input
              type="number"
              value={form.pregnancyWeeks}
              onChange={onChange('pregnancyWeeks')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              placeholder="24"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              {tr('Current Conditions')}
            </span>
            <input
              type="text"
              value={form.conditions}
              onChange={onChange('conditions')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              placeholder={tr('Hypertension, asthma')}
            />
          </label>

          <label className="inline-flex items-center gap-2 sm:col-span-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.isFirstPregnancy)}
              onChange={onChange('isFirstPregnancy')}
            />
            {tr('First pregnancy (if applicable)')}
          </label>

          {error && (
            <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/app/dashboard')}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {tr('Skip for now')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? tr('Saving...') : tr('Save & Continue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
