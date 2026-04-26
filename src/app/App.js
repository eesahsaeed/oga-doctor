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

