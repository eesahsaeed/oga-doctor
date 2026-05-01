import Navbar from '../Navbar';
import Footer from '../Footer';

export default function MarketingPageLayout({ title, subtitle, children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-3 pb-10 pt-24 sm:px-4 sm:pt-28">
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              {subtitle}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {children}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
