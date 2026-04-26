import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/api';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isPremium, setIsPremium] = useState(Boolean(user?.isPremium));
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setIsPremium(Boolean(user?.isPremium));
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      await apiClient.updateProfile({ name: name.trim(), isPremium });
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">
          Manage account details used across web and mobile.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={saveProfile} className="space-y-4 max-w-xl">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(event) => setIsPremium(event.target.checked)}
            />
            Premium membership
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {status && <p className="text-sm text-slate-600">{status}</p>}
        </form>
      </section>
    </div>
  );
}
