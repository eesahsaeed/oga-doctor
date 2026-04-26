import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';

const initialDashboard = {
  tip: {
    title: "Today's Health Tip",
    body: 'Loading your personalized tip...',
    date: '',
  },
  services: [],
  articles: [],
  upcomingAppointments: [],
  recentVitals: [],
  womensStage: 'general',
  pregnancyWeeks: '',
  isPremium: false,
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInfo, setSearchInfo] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const upcomingCount = useMemo(
    () => dashboard.upcomingAppointments?.length || 0,
    [dashboard.upcomingAppointments],
  );

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const payload = await apiClient.dashboard();
      if (payload?.success && payload.data) {
        setDashboard((prev) => ({ ...prev, ...payload.data }));
      }
    } catch (error) {
      setSearchInfo(error.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setSearchInfo('Enter a symptom or condition to search.');
      return;
    }

    try {
      const payload = await apiClient.search(searchQuery.trim());
      const count = Array.isArray(payload?.results)
        ? payload.results.length
        : 0;
      setSearchInfo(
        `Found ${count} result${count === 1 ? '' : 's'} for “${searchQuery.trim()}”.`,
      );
    } catch (error) {
      setSearchInfo(error.message || 'Search failed.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome to OgaDoctor Care
        </h1>
        <p className="mt-2 text-blue-100 max-w-2xl">
          Book consultations, review health reports, chat with AI support, and
          join video visits from one place.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/app/consultation/chat"
            className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
          >
            Start AI Consultation
          </Link>
          <Link
            to="/app/consultation/video"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Join Video Consultation
          </Link>
        </div>
      </section>

      <form
        onSubmit={runSearch}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="text-sm font-medium text-slate-700">
          Search records and symptoms
        </label>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            placeholder="e.g. chest pain, blood pressure, appointment"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>
        </div>
        {searchInfo && (
          <p className="mt-2 text-sm text-slate-600">{searchInfo}</p>
        )}
      </form>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Upcoming Appointments</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {upcomingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Care Plan</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {dashboard.womensStage === 'general'
              ? 'General'
              : dashboard.womensStage}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Membership</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {dashboard.isPremium ? 'Premium' : 'Standard'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Today’s Tip</h2>
          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="mt-1 text-sm font-semibold text-blue-700">
          {dashboard.tip?.title}
        </p>
        <p className="mt-2 text-sm text-slate-700 leading-6">
          {dashboard.tip?.body}
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Vitals
          </h2>
          <div className="mt-3 space-y-2">
            {(dashboard.recentVitals || []).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 flex items-center justify-between"
              >
                <span className="text-sm text-slate-600">{item.metric}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Appointments
          </h2>
          <div className="mt-3 space-y-2">
            {(dashboard.upcomingAppointments || []).map((appt) => (
              <div
                key={appt.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {appt.type} • {appt.time}
                </p>
                <p className="text-xs text-slate-600">{appt.doctor}</p>
                <p className="text-xs text-slate-500">{appt.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Recommended Articles
        </h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {(dashboard.articles || []).map((article, index) => (
            <article
              key={`${article.title}-${index}`}
              className="rounded-xl border border-slate-100 overflow-hidden"
            >
              <img
                src={article.image}
                alt={article.title}
                className="h-36 w-full object-cover"
              />
              <div className="p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {article.category}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-slate-900">
                  {article.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
