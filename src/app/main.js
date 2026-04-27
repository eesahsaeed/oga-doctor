import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App.js';
import CLayout from './components/Clayout.js';
import FixedPlugin from './components/FixedPlugin.js';
import PrivacyPolicy from './pages/PrivacyPolicy.js';
import TermsOfService from './pages/TermsOfService.js';
import { AuthProvider } from './context/AuthContext.js';
import {
  OnboardingRequiredRoute,
  ProtectedRoute,
  PublicOnlyRoute,
} from './components/app/RouteGuards.js';
import AppShell from './components/app/AppShell.js';
import SignInPage from './pages/auth/SignInPage.js';
import SignUpPage from './pages/auth/SignUpPage.js';
import OnboardingPage from './pages/app/OnboardingPage.js';
import DashboardPage from './pages/app/DashboardPage.js';
import SchedulePage from './pages/app/SchedulePage.js';
import NotificationsPage from './pages/app/NotificationsPage.js';
import ReportsPage from './pages/app/ReportsPage.js';
import ProfilePage from './pages/app/ProfilePage.js';
import AIConsultationPage from './pages/consultation/AIConsultationPage.js';
import VideoConsultationPage from './pages/consultation/VideoConsultationPage.js';
import AboutPage from './pages/marketing/AboutPage.js';
import ServicesPage from './pages/marketing/ServicesPage.js';
import ContactPage from './pages/marketing/ContactPage.js';
import BlogPage from './pages/marketing/BlogPage.js';
import MessagesPage from './pages/marketing/MessagesPage.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CLayout>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            <Route
              path="/auth/signin"
              element={
                <PublicOnlyRoute>
                  <SignInPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <PublicOnlyRoute>
                  <SignUpPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <OnboardingRequiredRoute>
                    <AppShell />
                  </OnboardingRequiredRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="consultation/chat"
                element={<AIConsultationPage />}
              />
              <Route
                path="consultation/video"
                element={<VideoConsultationPage />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <FixedPlugin />
        </CLayout>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
