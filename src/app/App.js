import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './sections/hero';
import Feature from './sections/feature';
import MobileConvenience from './sections/mobile-convenience';
import Testimonials from './sections/testimonials';
import Faqs from './sections/faqs';

function App() {
  return (
    <>
      <Navbar />
      <section className="pt-28 px-4">
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              New web care workspace available
            </p>
            <p className="text-lg font-semibold text-slate-900">
              Sign in to book appointments, chat, and video consult.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/auth/signin"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              to="/auth/signup"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </section>
      <Hero />
      <Feature />
      <MobileConvenience />
      <Testimonials />
      <Faqs />
      <Footer />
    </>
  );
}

export default App;
