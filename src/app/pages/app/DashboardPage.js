import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { isDoctorUser } from '../../lib/account';

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

function getServiceRoute(actionId) {
  if (actionId === 'consult_doctor') return '/app/consultation/doctors';
  if (actionId === 'consult_specialist') {
    return '/app/consultation/doctors?kind=specialist';
  }
  if (actionId === 'doctor_chat') return '/app/consultation/messages';
  if (actionId === 'records') return '/app/reports';
  return '/app/dashboard';
}

function stageToLabel(value = '') {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function DoctorDashboard({
  chats,
  loading,
  loadDoctorInbox,
  error,
  user,
  tr,
  formatDateTime,
}) {
  const stats = useMemo(() => {
    const activeChats = chats.filter((chat) => chat.status !== 'closed').length;
    const pendingReplies = chats.filter(
      (chat) => chat.lastMessage?.senderType === 'patient',
    ).length;
    const uniquePatients = new Set(
      chats.map((chat) => chat.patient?.id || chat.patientId).filter(Boolean),
    ).size;

    return {
      activeChats,
      pendingReplies,
      uniquePatients,
    };
  }, [chats]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {tr('Doctor Workspace')}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              {tr(
                'Respond to patient messages, join consultations, and keep your doctor profile ready across web and mobile.',
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            <Link
              to="/app/consultation/messages"
              className="w-full rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
            >
              {tr('Open Patient Messages')}
            </Link>
            <Link
              to="/app/consultation/video"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              {tr('Join Video Consultation')}
            </Link>
            <Link
              to="/app/profile"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              {tr('Update Profile')}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{tr('Active Conversations')}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {stats.activeChats}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{tr('Pending Replies')}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {stats.pendingReplies}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{tr('Patients Reached')}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {stats.uniquePatients}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{tr('Next Available')}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {tr(user?.nextAvailable || 'Today')}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {tr('Recent Patient Conversations')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {tr(
                  'Your latest patient threads appear here so you can jump back in quickly.',
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={loadDoctorInbox}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              {loading ? tr('Refreshing...') : tr('Refresh')}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {!loading && chats.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                {tr(
                  'No patient chats yet. Once a patient starts a doctor chat, it will show up here.',
                )}
              </div>
            )}

            {chats.map((chat) => (
              <Link
                key={chat.id}
                to={`/app/consultation/messages?chatId=${encodeURIComponent(chat.id)}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-sky-200 hover:bg-sky-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {chat.patient?.name || tr('Patient')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {chat.patient?.email || tr('No email available')}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(chat.lastMessageAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {chat.lastMessage?.message ||
                    tr('Open this conversation to review the latest message.')}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Practice Snapshot')}
          </h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{tr('Doctor')}</p>
              <p className="text-sm font-semibold text-slate-900">
                {user?.name || tr('Doctor')}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{tr('Specialty')}</p>
              <p className="text-sm font-semibold text-slate-900">
                {tr(user?.specialty || 'General Medicine')}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{tr('Reply Time')}</p>
              <p className="text-sm font-semibold text-slate-900">
                {tr(user?.responseTime || 'Usually responds within 30 minutes')}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">
                {tr('Consultation Modes')}
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {(user?.consultationModes || [])
                  .map((mode) => tr(String(mode).replaceAll('_', ' ')))
                  .join(', ') || tr('doctor chat, video')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tr, formatTime, formatDateTime } = useLanguage();
  const isDoctor = isDoctorUser(user);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInfo, setSearchInfo] = useState('');
  const [doctorChats, setDoctorChats] = useState([]);

  useEffect(() => {
    if (isDoctor) {
      loadDoctorInbox();
      return;
    }

    loadDashboard();
  }, [isDoctor]);

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
      setSearchInfo(error.message || tr('Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorInbox = async () => {
    setLoading(true);
    setSearchInfo('');
    try {
      const payload = await apiClient.doctorChats();
      setDoctorChats(payload?.chats || []);
    } catch (error) {
      setSearchInfo(error.message || tr('Failed to load doctor inbox.'));
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setSearchInfo(tr('Enter a symptom or condition to search.'));
      return;
    }

    try {
      const payload = await apiClient.search(searchQuery.trim());
      const count = Array.isArray(payload?.results)
        ? payload.results.length
        : 0;
      setSearchInfo(
        tr('Found {count} result{suffix} for "{query}".', {
          count,
          suffix: count === 1 ? '' : 's',
          query: searchQuery.trim(),
        }),
      );
    } catch (error) {
      setSearchInfo(error.message || tr('Search failed.'));
    }
  };

  if (isDoctor) {
    return (
      <DoctorDashboard
        chats={doctorChats}
        loading={loading}
        loadDoctorInbox={loadDoctorInbox}
        error={searchInfo}
        user={user}
        tr={tr}
        formatDateTime={formatDateTime}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-4 text-white shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {tr('Welcome to OgaDoctor Care')}
        </h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          {tr(
            'Book consultations, message doctors directly, chat with Aisha AI, and join video visits from one place.',
          )}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            to="/app/consultation/chat"
            className="w-full rounded-xl bg-white/20 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white/30 sm:w-auto"
          >
            {tr('Start AI Consultation')}
          </Link>
          <Link
            to="/app/consultation/doctors"
            className="w-full rounded-xl bg-white/20 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white/30 sm:w-auto"
          >
            {tr('Consult a Doctor')}
          </Link>
          <Link
            to="/app/consultation/doctors?kind=specialist"
            className="w-full rounded-xl bg-white/20 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white/30 sm:w-auto"
          >
            {tr('Consult Specialist Doctor')}
          </Link>
          <Link
            to="/app/consultation/video"
            className="w-full rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-50 sm:w-auto"
          >
            {tr('Join Video Consultation')}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(dashboard.services || []).map((service) => (
          <Link
            key={service.actionId || service.title}
            to={getServiceRoute(service.actionId)}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-blue-200"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {tr('Care Path')}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              {tr(service.title)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {tr(
                service.description || 'Open this area of your care dashboard.',
              )}
            </p>
            <p className="mt-4 text-sm font-semibold text-blue-700">
              {tr('Open now')}
            </p>
          </Link>
        ))}
      </section>

      <form
        onSubmit={runSearch}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="text-sm font-medium text-slate-700">
          {tr('Search records and symptoms')}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            placeholder={tr('e.g. chest pain, blood pressure, appointment')}
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {tr('Search')}
          </button>
        </div>
        {searchInfo && (
          <p className="mt-2 text-sm text-slate-600">{searchInfo}</p>
        )}
      </form>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            {tr('Upcoming Appointments')}
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {upcomingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr('Care Plan')}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {dashboard.womensStage === 'general'
              ? tr('General')
              : tr(stageToLabel(dashboard.womensStage))}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-slate-500">{tr('Membership')}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {dashboard.isPremium ? tr('Premium') : tr('Standard')}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr("Today's Tip")}
          </h2>
          <button
            type="button"
            onClick={loadDashboard}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
          >
            {loading ? tr('Refreshing...') : tr('Refresh')}
          </button>
        </div>
        <p className="mt-1 text-sm font-semibold text-blue-700">
          {tr(dashboard.tip?.title || '')}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {tr(dashboard.tip?.body || '')}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Recent Vitals')}
          </h2>
          <div className="mt-3 space-y-2">
            {(dashboard.recentVitals || []).length === 0 && (
              <p className="text-sm text-slate-500">{tr('No vitals yet.')}</p>
            )}
            {(dashboard.recentVitals || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm text-slate-600">
                  {tr(item.metric)}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr('Upcoming Appointments')}
          </h2>
          <div className="mt-3 space-y-2">
            {(dashboard.upcomingAppointments || []).length === 0 && (
              <p className="text-sm text-slate-500">
                {tr('No upcoming appointments.')}
              </p>
            )}
            {(dashboard.upcomingAppointments || []).map((appt) => (
              <div
                key={appt.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {tr(appt.type)} -{' '}
                  {appt.scheduledAt ? formatTime(appt.scheduledAt) : appt.time}
                </p>
                <p className="text-xs text-slate-600">{appt.doctor}</p>
                <p className="text-xs text-slate-500">{tr(appt.reason)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {tr('Recommended Articles')}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(dashboard.articles || []).map((article, index) => (
            <article
              key={`${article.title}-${index}`}
              className="overflow-hidden rounded-xl border border-slate-100"
            >
              <img
                src={article.image}
                alt={article.title}
                className="h-32 w-full object-cover sm:h-36"
              />
              <div className="p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {tr(article.category)}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-slate-900">
                  {tr(article.title)}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
