import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../lib/api';

function parseAppointmentStartDate(appointment) {
  if (appointment?.scheduledAt) {
    const parsed = new Date(appointment.scheduledAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

function formatAsICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildICS(appointment) {
  const startDate = parseAppointmentStartDate(appointment);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const title = `OgaDoctor - ${appointment.type || 'Consultation'}`;
  const description = `Doctor: ${appointment.doctor || 'TBD'}\\nReason: ${
    appointment.reason || 'General consultation'
  }`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OgaDoctor//Appointment//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id || crypto.randomUUID()}@ogadoctor`,
    `DTSTAMP:${formatAsICSDate(new Date())}`,
    `DTSTART:${formatAsICSDate(startDate)}`,
    `DTEND:${formatAsICSDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
    loadNotificationSettings();
  }, []);

  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const payload = await apiClient.appointments();
      if (payload?.success) {
        setAppointments({
          upcoming: payload.upcoming || [],
          past: payload.past || [],
        });
      }
    } catch (error) {
      setStatus(error.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const payload = await apiClient.getNotificationSettings();
      if (payload?.success) {
        setReminderEnabled(Boolean(payload.settings?.appointmentReminders));
      }
    } catch (_error) {
      // Keep existing value on silent failure.
    }
  };

  const bookAppointment = async (type) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(10, 0, 0, 0);

    const payload = {
      day: startDate.getDate().toString().padStart(2, '0'),
      weekday: startDate.toLocaleDateString('en-US', { weekday: 'short' }),
      time: '10:00 AM',
      doctor: type === 'Lab Visit' ? 'Lab Center Ikeja' : 'Dr. Sarah Bello',
      type,
      reason:
        type === 'Lab Visit'
          ? 'Routine diagnostics'
          : `${type} booking from web app`,
      status: 'Scheduled',
      statusColor: '#2563eb',
      scheduledAt: startDate.toISOString(),
    };

    try {
      const response = await apiClient.createAppointment(payload);
      setStatus(`${type} booked successfully.`);

      if (response?.appointment) {
        const ics = buildICS(response.appointment);
        downloadFile(
          `ogadoctor-${response.appointment.id || 'appointment'}.ics`,
          ics,
        );
      }

      await loadAppointments();
    } catch (error) {
      setStatus(error.message || 'Failed to book appointment.');
    }
  };

  const markCompleted = async (appointmentId) => {
    try {
      await apiClient.updateAppointment(appointmentId, {
        status: 'Completed',
        statusColor: '#64748b',
        isPast: true,
      });
      setStatus('Appointment marked as completed.');
      await loadAppointments();
    } catch (error) {
      setStatus(error.message || 'Failed to update appointment.');
    }
  };

  const updateReminders = async (nextValue) => {
    setReminderEnabled(nextValue);
    try {
      await apiClient.updateNotificationSettings({
        appointmentReminders: nextValue,
      });
      setStatus(
        nextValue
          ? 'Appointment reminders enabled.'
          : 'Appointment reminders disabled.',
      );
    } catch (error) {
      setReminderEnabled((prev) => !prev);
      setStatus(error.message || 'Failed to update reminder settings.');
    }
  };

  const syncAllToCalendar = () => {
    if (!appointments.upcoming.length) {
      setStatus('No upcoming appointments to sync.');
      return;
    }

    appointments.upcoming.forEach((appointment) => {
      const ics = buildICS(appointment);
      downloadFile(`ogadoctor-${appointment.id || 'appointment'}.ics`, ics);
    });

    setStatus(`Prepared ${appointments.upcoming.length} calendar file(s).`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
            <p className="text-sm text-slate-500">{monthLabel}</p>
          </div>

          <button
            type="button"
            onClick={syncAllToCalendar}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Sync Upcoming to Calendar
          </button>
        </div>

        {status && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {status}
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => bookAppointment('Video Consultation')}
          className="rounded-2xl bg-blue-600 p-4 text-left text-white hover:bg-blue-700"
        >
          <p className="font-semibold">Video Consultation</p>
          <p className="text-sm text-blue-100 mt-1">
            Book and auto-download calendar invite
          </p>
        </button>

        <button
          type="button"
          onClick={() => bookAppointment('In-Person')}
          className="rounded-2xl bg-blue-500 p-4 text-left text-white hover:bg-blue-600"
        >
          <p className="font-semibold">In-Person Visit</p>
          <p className="text-sm text-blue-100 mt-1">Book clinic appointment</p>
        </button>

        <button
          type="button"
          onClick={() => bookAppointment('Lab Visit')}
          className="rounded-2xl bg-cyan-600 p-4 text-left text-white hover:bg-cyan-700"
        >
          <p className="font-semibold">Lab Visit</p>
          <p className="text-sm text-cyan-100 mt-1">Book routine diagnostics</p>
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Appointments
          </h2>
          <button
            type="button"
            onClick={loadAppointments}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {(appointments.upcoming || []).map((appt) => (
            <article
              key={appt.id}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {appt.type} • {appt.time}
                  </p>
                  <p className="text-xs text-slate-600">{appt.doctor}</p>
                  <p className="text-xs text-slate-500">{appt.reason}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(`ogadoctor-${appt.id}.ics`, buildICS(appt))
                    }
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Add to Calendar
                  </button>

                  <button
                    type="button"
                    onClick={() => markCompleted(appt.id)}
                    className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Past Appointments
        </h2>
        <div className="mt-3 space-y-2">
          {(appointments.past || []).map((appt) => (
            <article
              key={appt.id}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <p className="text-sm font-semibold text-slate-900">
                {appt.type} • {appt.time}
              </p>
              <p className="text-xs text-slate-600">{appt.doctor}</p>
              <p className="text-xs text-slate-500">{appt.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Appointment Reminders
          </h2>
          <p className="text-sm text-slate-500">
            Get reminder notifications before scheduled visits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => updateReminders(!reminderEnabled)}
          className={[
            'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
            reminderEnabled
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          ].join(' ')}
        >
          {reminderEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </section>
    </div>
  );
}
