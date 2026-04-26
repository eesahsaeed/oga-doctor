import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.js';
import CLayout from './components/Clayout.js';
import FixedPlugin from './components/FixedPlugin.js';
import PrivacyPolicy from './pages/PrivacyPolicy.js';
import TermsOfService from './pages/TermsOfService.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CLayout>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
        <FixedPlugin />
      </CLayout>
    </BrowserRouter>
  </StrictMode>,
);
