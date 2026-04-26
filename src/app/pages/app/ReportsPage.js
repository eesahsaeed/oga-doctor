import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';

const initialData = {
  womensStage: 'general',
  pregnancyWeeks: '',
  overview: {
    avgHeartRate: '92 bpm',
    bloodPressure: '118/78',
    weight: '79.8 kg',
    hydration: '68%',
  },
  labResults: [],
  documents: [],
  vaccinations: [],
};

export default function ReportsPage() {
  const [reports, setReports] = useState(initialData);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const payload = await apiClient.reports();
      if (payload?.success && payload.data) {
        setReports((prev) => ({ ...prev, ...payload.data }));
      }
    } catch (error) {
      setStatus(error.message || 'Failed to load reports.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Reports & Records
          </h1>
          <p className="text-sm text-slate-500">
            Track vitals, labs, documents, and screening history.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Refresh Data
        </button>
      </section>

      {status && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
          {status}
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Avg Heart Rate</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {reports.overview?.avgHeartRate}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Blood Pressure</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {reports.overview?.bloodPressure}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Weight</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {reports.overview?.weight}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Hydration</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {reports.overview?.hydration}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Lab Results</h2>
        <div className="mt-3 space-y-2">
          {(reports.labResults || []).map((result, index) => (
            <article
              key={`${result.test}-${index}`}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <p className="text-sm font-semibold text-slate-900">
                {result.test}
              </p>
              <p className="text-xs text-slate-600">{result.date}</p>
              <p className="text-xs text-slate-500">{result.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Medical Documents
        </h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(reports.documents || []).map((doc, index) => (
            <article
              key={`${doc.title}-${index}`}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <p className="text-sm font-semibold text-slate-900">
                {doc.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">{doc.date}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Vaccinations & Screenings
        </h2>
        <ul className="mt-3 space-y-2">
          {(reports.vaccinations || []).map((entry, index) => (
            <li
              key={`${entry}-${index}`}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {entry}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
