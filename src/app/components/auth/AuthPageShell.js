import LanguageSelect from '../shared/LanguageSelect';
import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_HIGHLIGHTS = [
  'Doctor Messages',
  'Reports & Records',
  'Video Consultation',
];

export default function AuthPageShell({
  title,
  subtitle,
  children,
  footer = null,
  highlights = DEFAULT_HIGHLIGHTS,
  accessLabel = null,
  heroEyebrow = null,
  heroTitle = null,
  heroBody = null,
}) {
  const { tr } = useLanguage();

  return (
    <div className="relative min-h-screen bg-sky-50 lg:h-screen lg:overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.45),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(165,243,252,0.38),_transparent_32%),linear-gradient(160deg,_#f0f9ff_0%,_#ecfeff_42%,_#f8fafc_100%)]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(90deg,_rgba(14,116,144,0.08)_1px,_transparent_1px),linear-gradient(rgba(14,116,144,0.08)_1px,_transparent_1px)] bg-[size:36px_36px] opacity-70" />
      <div className="absolute left-[-5rem] top-16 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="absolute bottom-12 right-[-4rem] h-48 w-48 rounded-full bg-sky-200/45 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-3 py-3 sm:px-5 sm:py-4 lg:h-screen lg:min-h-0 lg:px-6">
        <div className="grid w-full gap-4 lg:h-[calc(100vh-2rem)] lg:grid-cols-[1.06fr_0.94fr]">
          <section className="hidden h-full min-h-0 flex-col justify-between rounded-[28px] border border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(236,254,255,0.95))] p-6 text-slate-900 backdrop-blur-xl xl:p-7 lg:flex">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700">
                <img
                  src="/image/ogaDoctor.png"
                  alt={tr('OgaDoctor')}
                  className="h-8 w-8 rounded-2xl bg-sky-50 object-contain p-1.5"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {tr('OgaDoctor')}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-700/80">
                    {tr('Your Virtual Clinic')}
                  </p>
                </div>
              </div>

              <div className="mt-8 max-w-lg xl:mt-10">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700/85 xl:text-sm">
                  {heroEyebrow || tr('Healthcare in Your Pocket')}
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-[1.08] text-slate-950 xl:mt-4 xl:text-[2.7rem]">
                  {heroTitle ||
                    tr(
                      'Trusted healthcare access designed for clarity, speed, and confidence.',
                    )}
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-600 xl:text-base xl:leading-7">
                  {heroBody ||
                    tr(
                      'Manage consultations, messages, appointments, and recovery flows in one calm, secure place.',
                    )}
                </p>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-sky-100 bg-white/85 px-3 py-3 xl:px-4 xl:py-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/70">
                    {tr('OgaDoctor')}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-900">
                    {tr(item)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-sky-100 bg-white/95 p-4 backdrop-blur sm:p-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col xl:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-sky-200 via-cyan-100 to-white xl:h-14 xl:w-14 xl:rounded-[20px]">
                  <img
                    src="/image/ogaDoctor.png"
                    alt={tr('OgaDoctor')}
                    className="h-8 w-8 rounded-2xl bg-white object-contain p-1.5 xl:h-10 xl:w-10"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                    OgaDoctor
                  </p>
                  <p className="text-sm text-slate-500">
                    {accessLabel || tr('Secure patient access')}
                  </p>
                </div>
              </div>
              <LanguageSelect
                showLabel={false}
                selectClassName="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
              />
            </div>

            <div className="mt-5 xl:mt-6">
              <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-[2.05rem]">
                {title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                {subtitle}
              </p>
            </div>

            <div className="mt-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              {children}
            </div>
            {footer ? <div className="mt-4 shrink-0">{footer}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
