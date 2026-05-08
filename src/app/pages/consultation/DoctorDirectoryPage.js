import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

const KIND_COPY = {
  all: {
    title: 'Consult a Doctor',
    description:
      'Choose a licensed doctor, start a direct conversation, and continue care inside the app.',
  },
  general: {
    title: 'Consult a Doctor',
    description:
      'Talk to a general doctor for everyday symptoms, follow-ups, and preventive care.',
  },
  specialist: {
    title: 'Consult a Specialist Doctor',
    description:
      'Connect with specialist doctors for focused care, second opinions, and ongoing treatment plans.',
  },
};

function getCopy(kind) {
  return KIND_COPY[kind] || KIND_COPY.all;
}

function formatModes(modes = []) {
  return modes
    .map((mode) => {
      if (mode === 'doctor_chat') return 'Doctor chat';
      if (mode === 'in_person') return 'In-person';
      return mode.replace(/_/g, ' ');
    })
    .join(' | ');
}

export default function DoctorDirectoryPage({ kind = 'general' }) {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [startingDoctorId, setStartingDoctorId] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [chatByDoctorId, setChatByDoctorId] = useState({});

  const copy = getCopy(kind);

  useEffect(() => {
    let active = true;

    async function loadDirectory() {
      setLoading(true);
      setError('');

      try {
        const [doctorPayload, chatPayload] = await Promise.all([
          apiClient.doctors({ kind }),
          apiClient.doctorChats(),
        ]);

        if (!active) return;

        setDoctors(
          Array.isArray(doctorPayload?.doctors) ? doctorPayload.doctors : [],
        );
        const mappedChats = Object.fromEntries(
          (chatPayload?.chats || []).map((chat) => [chat.doctorId, chat]),
        );
        setChatByDoctorId(mappedChats);
      } catch (loadError) {
        if (active) {
          setError(
            loadError.message || tr('Unable to load doctors right now.'),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDirectory();

    return () => {
      active = false;
    };
  }, [kind]);

  const visibleDoctors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return doctors;

    return doctors.filter((doctor) =>
      [doctor.name, doctor.title, doctor.specialty, doctor.bio]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [doctors, search]);

  const startChat = async (doctor) => {
    setStartingDoctorId(doctor.id);
    setError('');

    try {
      const payload = await apiClient.createDoctorChat({
        doctorId: doctor.id,
        subject: doctor.isSpecialist
          ? `${doctor.specialty} consultation`
          : 'Doctor consultation',
      });

      const chatId = payload?.chat?.id;
      navigate(
        chatId
          ? `/app/consultation/messages?chatId=${encodeURIComponent(chatId)}`
          : '/app/consultation/messages',
      );
    } catch (chatError) {
      setError(
        chatError.message || tr('Unable to start doctor chat right now.'),
      );
    } finally {
      setStartingDoctorId('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {tr(copy.title)}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {tr(copy.description)}{' '}
              {tr(
                'AI chat and video consultation remain available whenever you need instant support or a live visit.',
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/app/consultation/doctors"
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold',
                kind === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {tr('Doctors')}
            </Link>
            <Link
              to="/app/consultation/specialists"
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold',
                kind === 'specialist'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {tr('Specialists')}
            </Link>
            <Link
              to="/app/consultation/messages"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {tr('Doctor Messages')}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 md:max-w-md"
            placeholder={tr('Search doctor, specialty, or care area')}
          />
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {tr('Direct doctor messaging')}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {tr('Specialist matching')}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {tr('Video consultation available')}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            {tr('Loading doctors...')}
          </div>
        )}

        {!loading && visibleDoctors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm">
            {tr(
              'No doctors matched your search. Try another specialty or switch between general doctors and specialists.',
            )}
          </div>
        )}

        {visibleDoctors.map((doctor) => {
          const existingChat = chatByDoctorId[doctor.id];
          const isStarting = startingDoctorId === doctor.id;

          return (
            <article
              key={doctor.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <img
                  src={doctor.avatar || '/image/ogaDoctor.png'}
                  alt={doctor.name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {doctor.name}
                    </h2>
                    <span
                      className={[
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                        doctor.isSpecialist
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700',
                      ].join(' ')}
                    >
                      {doctor.isSpecialist
                        ? tr('Specialist')
                        : tr('General Care')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {tr(doctor.title)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {tr(doctor.specialty)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {tr(doctor.bio)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {tr('Experience')}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {doctor.yearsExperience} {tr('years')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {tr('Response')}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {tr(doctor.responseTime || 'Reply time varies')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {tr('Next Available')}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {tr(doctor.nextAvailable || 'To be confirmed')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {tr('Consultation')}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {tr(doctor.priceLabel || 'Pricing on request')}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(doctor.languages || []).map((language) => (
                  <span
                    key={`${doctor.id}-${language}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {language}
                  </span>
                ))}
                {doctor.consultationModes?.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {tr(formatModes(doctor.consultationModes))}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void startChat(doctor)}
                  disabled={isStarting}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isStarting
                    ? tr('Opening...')
                    : existingChat
                      ? tr('Continue Doctor Chat')
                      : tr('Chat with Doctor')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/consultation/video')}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {tr('Start Video Consultation')}
                </button>
              </div>

              {existingChat && (
                <p className="mt-3 text-xs text-slate-500">
                  {tr(
                    'Existing conversation found. Your last message thread is ready to continue.',
                  )}
                </p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
