import Navbar from '../Navbar';
import Footer from '../Footer';

export default function MarketingPageLayout({ title, subtitle, children }) {
  return (
    <>
      <Navbar />
      <main className="pt-28 px-4 pb-10 bg-slate-50 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-5">
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 text-slate-600 leading-7">{subtitle}</p>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            {children}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
