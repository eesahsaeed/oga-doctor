import express from 'express';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { AccessToken } from 'livekit-server-sdk';

import Patient from '../schema/PatientSchema.js';
import Doctor from '../schema/DoctorSchema.js';
import DoctorChat from '../schema/DoctorChatSchema.js';
import ConsultationTranscript from '../schema/ConsultationTranscriptSchema.js';
import LegacyUser from '../schema/UserSchema.js';
import { JWT_SECRET } from '../helper.js';
import {
  buildBackblazeProxyUrl,
  deleteBackblazeFileByName,
  downloadBackblazeFileByName,
  extractBackblazeFileNameFromUrl,
  getBackblazeConfig,
  uploadDoctorAvatarToBackblaze,
} from '../services/backblazeB2.js';
import { isMailerConfigured, sendMail } from '../services/mailer.js';
import { buildNameAvatarDataUrl } from '../services/nameAvatar.js';
import {
  buildDoctorGreetingMessage,
  buildHealthSystemPrompt,
  localizeApiPayload,
  normalizeLanguage,
  translateServerText,
} from '../i18n.js';

const router = express.Router();
const doctorChatStreamClients = new Map();

router.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (payload) =>
    originalJson(localizeApiPayload(getRequestedLanguage(req), payload));
  next();
});

function getLiveKitConfig() {
  return {
    url: (process.env.LIVEKIT_URL || '').trim(),
    publicUrl: (process.env.LIVEKIT_PUBLIC_URL || '').trim(),
    apiKey: (process.env.LIVEKIT_API_KEY || '').trim(),
    apiSecret: (process.env.LIVEKIT_API_SECRET || '').trim(),
    tokenTtl: (process.env.LIVEKIT_TOKEN_TTL || '2h').trim(),
  };
}

function todayLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeRoomName(rawValue = '') {
  const cleaned = rawValue
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return cleaned;
}

const DEV_DATABASE_RESET_CONFIRMATION = 'CLEAR OGADOCTOR DATA';

function allowProductionDatabaseClear() {
  return (
    String(process.env.ALLOW_PROD_DB_CLEAR || '')
      .trim()
      .toLowerCase() === 'true'
  );
}

const DEFAULT_DOCTORS = [
  {
    id: 'doctor-general-sarah-bello',
    email: 'dr.sarah@ogadoctor.com',
    name: 'Dr. Sarah Bello',
    title: 'General Practitioner',
    specialty: 'General Medicine',
    isSpecialist: false,
    bio: 'Experienced family physician focused on everyday care, preventive medicine, and follow-up consultations.',
    languages: ['English', 'Yoruba'],
    consultationModes: ['doctor_chat', 'video', 'in_person'],
    yearsExperience: 8,
    responseTime: 'Replies in about 10 mins',
    nextAvailable: 'Today, 3:30 PM',
    status: 'available',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
    priceLabel: 'From NGN 8,000',
  },
  {
    id: 'doctor-general-adebayo',
    email: 'dr.adebayo@ogadoctor.com',
    name: 'Dr. Adebayo Ogunleye',
    title: 'Primary Care Doctor',
    specialty: 'Internal Medicine',
    isSpecialist: false,
    bio: 'Primary care doctor helping patients manage recurring symptoms, medications, and general health concerns.',
    languages: ['English', 'Pidgin'],
    consultationModes: ['doctor_chat', 'video'],
    yearsExperience: 11,
    responseTime: 'Replies in about 15 mins',
    nextAvailable: 'Today, 5:00 PM',
    status: 'available',
    avatar:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300',
    priceLabel: 'From NGN 10,000',
  },
  {
    id: 'doctor-specialist-ifeoma',
    email: 'dr.ifeoma@ogadoctor.com',
    name: 'Dr. Ifeoma Okafor',
    title: 'Consultant Cardiologist',
    specialty: 'Cardiology',
    isSpecialist: true,
    bio: 'Cardiology specialist for chest pain reviews, hypertension management, and long-term heart care.',
    languages: ['English', 'Igbo'],
    consultationModes: ['doctor_chat', 'video'],
    yearsExperience: 14,
    responseTime: 'Replies in about 12 mins',
    nextAvailable: 'Tomorrow, 9:00 AM',
    status: 'available',
    avatar:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300',
    priceLabel: 'From NGN 18,000',
  },
  {
    id: 'doctor-specialist-rahman',
    email: 'dr.rahman@ogadoctor.com',
    name: 'Dr. Abdulrahman Musa',
    title: 'Consultant Pediatrician',
    specialty: 'Pediatrics',
    isSpecialist: true,
    bio: 'Pediatric specialist supporting parents with urgent child health concerns, growth reviews, and follow-up care.',
    languages: ['English', 'Hausa'],
    consultationModes: ['doctor_chat', 'video', 'in_person'],
    yearsExperience: 9,
    responseTime: 'Replies in about 8 mins',
    nextAvailable: 'Today, 6:15 PM',
    status: 'available',
    avatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    priceLabel: 'From NGN 16,000',
  },
];

const GENERAL_DOCTOR_SPECIALTIES = new Set([
  'general medicine',
  'internal medicine',
  'primary care',
  'general practice',
  'family medicine',
  'family physician',
  'community medicine',
]);

function inferDoctorIsSpecialist({ title = '', specialty = '' } = {}) {
  const normalizedTitle = toOptionalString(title).toLowerCase();
  if (
    normalizedTitle.includes('consultant') ||
    normalizedTitle.includes('specialist')
  ) {
    return true;
  }

  const normalizedSpecialty = toOptionalString(specialty).toLowerCase();
  if (!normalizedSpecialty) {
    return false;
  }

  return !GENERAL_DOCTOR_SPECIALTIES.has(normalizedSpecialty);
}

function isLocalHostname(hostname = '') {
  const value = hostname.toLowerCase();
  if (!value) return true;
  if (value === 'localhost' || value === '127.0.0.1' || value === '::1')
    return true;
  if (value.endsWith('.local')) return true;

  const ipv4Match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) return false;

  const [a, b] = ipv4Match.slice(1).map((octet) => Number(octet));
  if (a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function requestIsSecure(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (forwardedProto === 'https' || forwardedProto === 'wss') return true;

  const origin = String(req.headers.origin || '').trim();
  if (origin) {
    try {
      return new URL(origin).protocol === 'https:';
    } catch (_error) {
      // ignore malformed origin headers and fall back to express metadata
    }
  }

  return Boolean(req.secure);
}

function requestIsLikelyPublic(req) {
  if ((process.env.NODE_ENV || '').trim().toLowerCase() === 'production') {
    return true;
  }

  const hostHeader = String(
    req.headers['x-forwarded-host'] || req.headers.host || '',
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

  if (!hostHeader) return requestIsSecure(req);

  const hostName = hostHeader.split(':')[0];
  if (isLocalHostname(hostName)) return requestIsSecure(req);
  return true;
}

function isProductionRuntime() {
  return (process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function trimTrailingSlash(value = '') {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

function getRequestOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const proto = forwardedProto || (requestIsSecure(req) ? 'https' : 'http');
  const forwardedHost = String(req.headers['x-forwarded-host'] || '')
    .split(',')[0]
    .trim();
  const host = forwardedHost || String(req.headers.host || '').trim();

  if (!host) {
    return '';
  }

  return `${proto}://${host}`;
}

function getPasswordResetWebBaseUrl(req) {
  const resetOverride = trimTrailingSlash(
    process.env.PASSWORD_RESET_WEB_URL || '',
  );
  const configured = trimTrailingSlash(
    process.env.APP_BASE_URL ||
      process.env.WEB_APP_URL ||
      process.env.PUBLIC_APP_URL ||
      process.env.VITE_APP_BASE_URL ||
      '',
  );
  const originHeader = trimTrailingSlash(
    String(req.headers.origin || '').trim(),
  );
  const requestOrigin = trimTrailingSlash(getRequestOrigin(req));

  if (resetOverride) {
    return resetOverride;
  }

  if (!isProductionRuntime()) {
    return (
      originHeader || configured || requestOrigin || 'http://localhost:5173'
    );
  }

  return configured || requestOrigin || 'https://ogadoctor.com.ng';
}

function getRequestedLanguage(req) {
  return normalizeLanguage(
    req.body?.language ||
      req.query?.language ||
      req.headers['x-language'] ||
      req.headers['accept-language'] ||
      'en',
  );
}

function hashPasswordResetToken(token) {
  return crypto
    .createHash('sha256')
    .update(String(token || '').trim())
    .digest('hex');
}

function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  return {
    rawToken,
    tokenHash: hashPasswordResetToken(rawToken),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

function clearPasswordResetState(user) {
  user.passwordResetTokenHash = '';
  user.passwordResetExpiresAt = '';
  user.passwordResetRequestedAt = '';
}

function isPasswordResetTokenStillValid(user) {
  if (!user?.passwordResetTokenHash || !user?.passwordResetExpiresAt) {
    return false;
  }

  const expiresAt = new Date(user.passwordResetExpiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return expiresAt.getTime() > Date.now();
}

function buildPasswordResetEmail({ user, webResetLink, language }) {
  const appName =
    String(process.env.APP_NAME || 'OgaDoctor').trim() || 'OgaDoctor';
  const recipientName = user?.name?.trim() || 'there';
  const emailLanguage = normalizeLanguage(
    language || user?.onboarding?.language || 'en',
  );
  const expiryLabel = translateServerText(emailLanguage, '60 minutes');
  const supportEmail = String(
    process.env.SUPPORT_EMAIL ||
      process.env.SMTP_USER ||
      'support@ogadoctor.com.ng',
  ).trim();
  const buttonLabel = translateServerText(emailLanguage, 'Reset Password');
  const heading = translateServerText(emailLanguage, 'Reset your password');
  const greeting = translateServerText(emailLanguage, 'Hello {name},', {
    name: recipientName,
  });
  const intro = translateServerText(
    emailLanguage,
    'We received a request to reset your {appName} password.',
    { appName },
  );
  const expiryMessage = translateServerText(
    emailLanguage,
    'This link expires in {value}. If the button does not open, copy and paste this link into your browser:',
    { value: expiryLabel },
  );
  const ignoreMessage = translateServerText(
    emailLanguage,
    'If you did not request this reset, you can safely ignore this email.',
  );

  return {
    subject: translateServerText(emailLanguage, '{appName} password reset', {
      appName,
    }),
    text: [
      greeting,
      '',
      intro,
      '',
      `${buttonLabel}: ${webResetLink}`,
      '',
      expiryMessage,
      webResetLink,
      '',
      ignoreMessage,
      '',
      `${appName} Support: ${supportEmail}`,
    ]
      .filter(Boolean)
      .join('\n'),
    html: `
      <div style="margin:0; padding:32px 16px; background:#f4f7fb;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
          ${intro}
        </div>
        <div style="max-width:600px; margin:0 auto; font-family:Arial, sans-serif; color:#0f172a;">
          <div style="margin-bottom:16px; text-align:center;">
            <div style="display:inline-block; padding:8px 14px; border-radius:999px; background:#dbeafe; color:#1d4ed8; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
              ${appName}
            </div>
          </div>
          <div style="background:#ffffff; border:1px solid #dbe5f0; border-radius:24px; overflow:hidden; box-shadow:0 18px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding:32px 32px 20px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%); border-bottom:1px solid #e2e8f0;">
              <p style="margin:0 0 10px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#2563eb;">
                ${appName}
              </p>
              <h1 style="margin:0; font-size:28px; line-height:1.2; color:#0f172a;">
                ${heading}
              </h1>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#0f172a;">
                ${greeting}
              </p>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#334155;">
                ${intro}
              </p>
              <div style="margin:0 0 28px; text-align:center;">
                <a
                  href="${webResetLink}"
                  style="display:inline-block; padding:14px 28px; border-radius:14px; background:#2563eb; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; box-shadow:0 10px 24px rgba(37, 99, 235, 0.28);"
                >
                  ${buttonLabel}
                </a>
              </div>
              <div style="margin:0 0 24px; padding:18px 20px; border-radius:16px; background:#f8fafc; border:1px solid #e2e8f0;">
                <p style="margin:0 0 10px; font-size:14px; line-height:1.7; color:#475569;">
                  ${expiryMessage}
                </p>
                <p style="margin:0; font-size:13px; line-height:1.7; word-break:break-all;">
                  <a href="${webResetLink}" style="color:#2563eb; text-decoration:none;">${webResetLink}</a>
                </p>
              </div>
              <p style="margin:0; font-size:13px; line-height:1.7; color:#64748b;">
                ${ignoreMessage}
              </p>
            </div>
          </div>
          <div style="padding:18px 8px 0; text-align:center; color:#64748b; font-size:12px; line-height:1.7;">
            <p style="margin:0;">${appName} Support: <a href="mailto:${supportEmail}" style="color:#2563eb; text-decoration:none;">${supportEmail}</a></p>
          </div>
        </div>
      </div>
    `,
  };
}

function normalizeLiveKitUrl(rawUrl, req) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return { ok: false, message: 'LIVEKIT_URL is empty.' };
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(candidate)) {
    candidate = `${requestIsSecure(req) ? 'wss://' : 'ws://'}${candidate}`;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch (_error) {
    return {
      ok: false,
      message:
        'LIVEKIT_URL is invalid. Use a valid ws:// or wss:// server address.',
    };
  }

  let protocol = parsed.protocol.toLowerCase();
  if (protocol === 'http:') protocol = 'ws:';
  if (protocol === 'https:') protocol = 'wss:';
  if (protocol !== 'ws:' && protocol !== 'wss:') {
    return {
      ok: false,
      message: 'LIVEKIT_URL must start with ws:// or wss://.',
    };
  }

  if (requestIsSecure(req) && protocol === 'ws:') {
    protocol = 'wss:';
  }

  const normalizedPath =
    parsed.pathname && parsed.pathname !== '/'
      ? parsed.pathname.replace(/\/+$/, '')
      : '';
  const normalizedUrl = `${protocol}//${parsed.host}${normalizedPath}`;
  const allowPrivate = String(process.env.LIVEKIT_ALLOW_PRIVATE_URL || '')
    .trim()
    .toLowerCase();
  const allowPrivateUrl = allowPrivate === 'true' || allowPrivate === '1';

  if (
    requestIsLikelyPublic(req) &&
    isLocalHostname(parsed.hostname) &&
    !allowPrivateUrl
  ) {
    return {
      ok: false,
      message:
        'LIVEKIT_URL points to localhost/private network. In production, set LIVEKIT_URL to a public wss:// endpoint.',
    };
  }

  return {
    ok: true,
    url: normalizedUrl,
  };
}

function buildDefaultAppointments() {
  return [
    {
      id: uuidv4(),
      day: '12',
      weekday: 'Tue',
      time: '09:30 AM',
      doctor: 'Dr. Mim Ankhtr',
      type: 'Video Consultation',
      reason: 'Depression follow-up & medication review',
      status: 'Confirmed',
      statusColor: '#10b981',
      isPast: false,
      scheduledAt: '2026-05-12T09:30:00.000Z',
    },
    {
      id: uuidv4(),
      day: '18',
      weekday: 'Mon',
      time: '02:15 PM',
      doctor: 'Dr. Sarah Bello',
      type: 'In-Person',
      reason: 'Routine physical examination',
      status: 'Pending',
      statusColor: '#f59e0b',
      isPast: false,
      scheduledAt: '2026-05-18T14:15:00.000Z',
    },
    {
      id: uuidv4(),
      day: '20',
      weekday: 'Thu',
      time: '10:45 AM',
      doctor: 'Dr. Adebayo',
      type: 'Video Consultation',
      reason: 'Initial depression screening',
      status: 'Completed',
      statusColor: '#64748b',
      isPast: true,
      scheduledAt: '2026-04-20T10:45:00.000Z',
    },
  ];
}

function buildDefaultNotifications() {
  return [
    {
      id: uuidv4(),
      category: 'appointment',
      title: 'Appointment Confirmed',
      description: 'Video consultation booked successfully.',
      timestamp: `Today • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      icon: 'calendar-check-outline',
      color: '#10b981',
      actionLabel: 'View details',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      category: 'lab',
      title: 'Lab Results Available',
      description: 'Your latest CBC report is now available.',
      timestamp: `Today • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      icon: 'beaker-outline',
      color: '#2563eb',
      actionLabel: 'View report',
      createdAt: new Date().toISOString(),
    },
  ];
}

function buildDefaultVitals() {
  return [
    {
      id: uuidv4(),
      metric: 'Heart Rate',
      value: '96 bpm',
      recordedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      metric: 'Weight',
      value: '80 kg',
      recordedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: uuidv4(),
      metric: 'Water Intake',
      value: '2.1 L',
      recordedAt: new Date().toISOString(),
    },
  ];
}

function buildDefaultLabResults() {
  return [
    {
      test: 'Full Blood Count (FBC)',
      date: 'Feb 18, 2026',
      status: 'Normal • Reviewed by Dr. Sarah',
    },
    {
      test: 'Lipid Profile',
      date: 'Jan 29, 2026',
      status: 'Cholesterol slightly elevated',
    },
    { test: 'HbA1c', date: 'Dec 12, 2025', status: '5.6% • Good control' },
  ];
}

function buildDefaultDocuments() {
  return [
    {
      title: 'Chest X-Ray Report',
      date: 'Feb 10, 2026',
      icon: 'file-document',
      color: '#2563eb',
    },
    {
      title: 'ECG Summary',
      date: 'Jan 15, 2026',
      icon: 'heart-pulse',
      color: '#ef4444',
    },
    {
      title: 'Prescription - Jan 2026',
      date: 'Jan 31, 2026',
      icon: 'pill',
      color: '#f59e0b',
    },
  ];
}

function buildDefaultVaccinations() {
  return [
    'COVID-19 Booster (Pfizer) – Oct 2025',
    'Influenza (Flu) – Sep 2025',
    'Hepatitis B (3rd dose) – Mar 2025',
  ];
}

function defaultNotificationSettings() {
  return {
    pushEnabled: true,
    appointmentReminders: true,
    pregnancyMilestones: true,
  };
}

function defaultUserProfile() {
  return {
    phone: '',
    dateOfBirth: '',
    bloodGroup: '',
    genotype: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    medications: '',
    heightCm: '',
    weightKg: '',
  };
}

function defaultDoctorProfile() {
  return {
    phone: '',
    practiceAddress: '',
    licenseNumber: '',
    consultationFocus: '',
  };
}

function defaultDoctorOnboarding(language = 'en') {
  return {
    language: normalizeLanguage(language),
    onboardingCompleted: false,
  };
}

function toOptionalString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function doctorLanguageDisplayName(value = '') {
  const normalized = normalizeLanguage(value);

  if (normalized === 'ha') return 'Hausa';
  if (normalized === 'ig') return 'Igbo';
  if (normalized === 'yo') return 'Yoruba';
  if (normalized === 'pcm') return 'Pidgin';
  return normalized === 'en' ? 'English' : toOptionalString(value);
}

function normalizeDoctorLanguageList(input = [], fallbackLanguage = 'en') {
  const rawValues = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : [];

  const nextValues = rawValues
    .map((entry) => doctorLanguageDisplayName(entry))
    .filter(Boolean);

  if (nextValues.length === 0) {
    const fallbackLabel = doctorLanguageDisplayName(fallbackLanguage);
    if (fallbackLabel) {
      nextValues.push(fallbackLabel);
    }
  }

  return [...new Set(nextValues)];
}

function normalizeDoctorConsultationModes(input = [], fallback = []) {
  const rawValues = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : [];

  const normalized = rawValues
    .map((entry) => toOptionalString(entry).toLowerCase().replace(/\s+/g, '_'))
    .filter(Boolean);

  if (normalized.length > 0) {
    return [...new Set(normalized)];
  }

  return Array.isArray(fallback) ? [...new Set(fallback.filter(Boolean))] : [];
}

function normalizeDoctorStatus(value = '', fallback = 'available') {
  const normalized = toOptionalString(value).toLowerCase();
  if (
    normalized === 'available' ||
    normalized === 'busy' ||
    normalized === 'offline'
  ) {
    return normalized;
  }
  return fallback;
}

function sanitizeProfilePayload(input = {}) {
  return {
    phone: toOptionalString(input.phone),
    dateOfBirth: toOptionalString(input.dateOfBirth),
    bloodGroup: toOptionalString(input.bloodGroup),
    genotype: toOptionalString(input.genotype),
    address: toOptionalString(input.address),
    emergencyContactName: toOptionalString(input.emergencyContactName),
    emergencyContactPhone: toOptionalString(input.emergencyContactPhone),
    allergies: toOptionalString(input.allergies),
    medications: toOptionalString(input.medications),
    heightCm: toOptionalString(input.heightCm),
    weightKg: toOptionalString(input.weightKg),
  };
}

function sanitizeDoctorProfilePayload(input = {}) {
  return {
    phone: toOptionalString(input.phone),
    practiceAddress: toOptionalString(input.practiceAddress),
    licenseNumber: toOptionalString(input.licenseNumber),
    consultationFocus: toOptionalString(input.consultationFocus),
  };
}

function resolveDoctorProfileUpdatePayload(body = {}) {
  const hasNestedProfile =
    body?.profile &&
    typeof body.profile === 'object' &&
    !Array.isArray(body.profile);

  if (hasNestedProfile) {
    return body.profile;
  }

  const hasLegacyFields = [
    'phone',
    'practiceAddress',
    'licenseNumber',
    'consultationFocus',
  ].some((field) => typeof body?.[field] === 'string');

  return hasLegacyFields ? body : null;
}

function isInlineImageDataUrl(value = '') {
  return /^data:image\//i.test(String(value || '').trim());
}

function resolveDoctorAvatarValue({
  avatar,
  name,
  fallbackAvatar = '',
  allowGeneratedFallback = true,
} = {}) {
  const nextAvatar = toOptionalString(avatar);
  if (nextAvatar) {
    return nextAvatar;
  }

  const currentAvatar = toOptionalString(fallbackAvatar);
  if (currentAvatar && !isInlineImageDataUrl(currentAvatar)) {
    return currentAvatar;
  }

  if (!allowGeneratedFallback) {
    return currentAvatar;
  }

  return buildNameAvatarDataUrl(name || 'Doctor');
}

function buildDeliveredAvatarValue(
  avatar = '',
  fallbackName = 'Doctor',
  version = '',
) {
  const rawValue = toOptionalString(avatar);
  if (!rawValue) {
    return buildNameAvatarDataUrl(fallbackName);
  }

  if (isInlineImageDataUrl(rawValue)) {
    return rawValue;
  }

  const fileName = extractBackblazeFileNameFromUrl(rawValue);
  if (fileName) {
    return buildBackblazeProxyUrl(fileName, version);
  }

  return rawValue;
}

function getSafePatientSummary(patient) {
  return {
    id: patient?.id || '',
    accountType: 'patient',
    name: patient?.name || '',
    email: patient?.email || '',
    avatar: buildNameAvatarDataUrl(
      patient?.name || patient?.email || 'Patient',
    ),
  };
}

function getSafeDoctor(doctor) {
  return {
    id: doctor.id,
    accountType: 'doctor',
    name: doctor.name || '',
    title: doctor.title || '',
    specialty: doctor.specialty || '',
    isSpecialist: Boolean(doctor.isSpecialist),
    bio: doctor.bio || '',
    languages: Array.isArray(doctor.languages) ? doctor.languages : [],
    consultationModes: Array.isArray(doctor.consultationModes)
      ? doctor.consultationModes
      : [],
    yearsExperience: Number(doctor.yearsExperience || 0),
    responseTime: doctor.responseTime || '',
    nextAvailable: doctor.nextAvailable || '',
    status: doctor.status || 'available',
    avatar: buildDeliveredAvatarValue(
      resolveDoctorAvatarValue({
        avatar: doctor.avatar,
        name: doctor.name || doctor.title || 'Doctor',
        fallbackAvatar: doctor.avatar,
      }),
      doctor.name || doctor.title || 'Doctor',
      doctor.updatedAt || doctor.createdAt || '',
    ),
    priceLabel: doctor.priceLabel || '',
  };
}

function isDoctorProfileVisibleToPatients(doctor) {
  if (!doctor) {
    return false;
  }

  if (doctor?.onboarding?.onboardingCompleted === false) {
    return false;
  }

  const profile = doctor.profile || {};
  const hasCoreIdentity =
    Boolean(toOptionalString(doctor.name)) &&
    Boolean(toOptionalString(doctor.title)) &&
    Boolean(toOptionalString(doctor.specialty)) &&
    Boolean(toOptionalString(doctor.bio));
  const hasPracticeDetails =
    Boolean(toOptionalString(profile.phone)) &&
    Boolean(toOptionalString(profile.practiceAddress)) &&
    Boolean(toOptionalString(profile.licenseNumber));
  const hasLanguages =
    Array.isArray(doctor.languages) &&
    doctor.languages.filter(Boolean).length > 0;
  const hasConsultationModes =
    Array.isArray(doctor.consultationModes) &&
    doctor.consultationModes.filter(Boolean).length > 0;

  return (
    hasCoreIdentity &&
    hasPracticeDetails &&
    hasLanguages &&
    hasConsultationModes
  );
}

async function ensureDoctorsSeeded() {
  const existingDoctors = await Doctor.scan().exec();
  const existingById = new Map(
    (Array.isArray(existingDoctors) ? existingDoctors : []).map((doctor) => [
      doctor.id,
      doctor,
    ]),
  );
  const existingEmails = new Set(
    (Array.isArray(existingDoctors) ? existingDoctors : [])
      .map((doctor) => normalizeEmailValue(doctor.email))
      .filter(Boolean),
  );

  const missingSeededDoctors = DEFAULT_DOCTORS.filter(
    (doctor) =>
      !existingById.has(doctor.id) &&
      !existingEmails.has(normalizeEmailValue(doctor.email)),
  ).map((doctor) => new Doctor(doctor));

  if (missingSeededDoctors.length > 0) {
    await Promise.all(missingSeededDoctors.map((doctor) => doctor.save()));
  }

  return Doctor.scan().exec();
}

async function findDoctorById(doctorId) {
  await ensureDoctorsSeeded();
  return Doctor.get(doctorId);
}

async function findPatientById(patientId) {
  if (!patientId) {
    return null;
  }

  const patients = await scanModelByField(Patient, 'id', patientId);
  return patients[0] || null;
}

function buildDoctorGreeting(doctor, language = 'en') {
  return {
    id: uuidv4(),
    senderType: 'doctor',
    senderId: doctor.id,
    senderName: doctor.name,
    senderLanguage: normalizeLanguage(language),
    message: buildDoctorGreetingMessage(doctor.name, language),
    createdAt: new Date().toISOString(),
    readBy: ['doctor'],
  };
}

function buildChatMessage(senderType, user, message) {
  return {
    id: uuidv4(),
    senderType,
    senderId: user.id,
    senderName:
      user.name ||
      (senderType === 'doctor' ? user.title || 'Doctor' : 'Patient'),
    senderLanguage: normalizeLanguage(user?.onboarding?.language || 'en'),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    readBy: [senderType],
  };
}

const DOCTOR_CHAT_TYPING_WINDOW_MS = 6500;

function getDoctorChatViewerType(user) {
  return isDoctorAccount(user) ? 'doctor' : 'patient';
}

function normalizeDoctorChatReadBy(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((entry) =>
          String(entry || '')
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ];
}

function normalizeDoctorChatTypingState(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const senderType = String(value.senderType || '')
    .trim()
    .toLowerCase();
  const expiresAt = String(value.expiresAt || '').trim();

  if (!['doctor', 'patient'].includes(senderType) || !expiresAt) {
    return null;
  }

  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return null;
  }

  return {
    senderType,
    senderId: String(value.senderId || '').trim(),
    senderName: String(value.senderName || '').trim(),
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

function getDoctorChatTypingIndicator(chat, user) {
  const viewerType = getDoctorChatViewerType(user);
  const typingState = normalizeDoctorChatTypingState(chat?.typingState);

  if (!typingState || typingState.senderType === viewerType) {
    return null;
  }

  return typingState;
}

function clearDoctorChatTypingStateForSender(chat, senderType = '') {
  const typingState = normalizeDoctorChatTypingState(chat?.typingState);
  const normalizedSenderType = String(senderType || '')
    .trim()
    .toLowerCase();

  if (
    !typingState ||
    (normalizedSenderType && typingState.senderType !== normalizedSenderType)
  ) {
    return false;
  }

  delete chat.typingState;
  return true;
}

async function updateDoctorChatTypingState(chat, user, isTyping) {
  const senderType = getDoctorChatViewerType(user);
  const nextTyping = Boolean(isTyping);

  if (!nextTyping) {
    const changed = clearDoctorChatTypingStateForSender(chat, senderType);
    if (changed) {
      await chat.save();
    }
    return chat;
  }

  chat.typingState = {
    senderType,
    senderId: user.id,
    senderName:
      user.name ||
      (senderType === 'doctor' ? user.title || 'Doctor' : 'Patient'),
    expiresAt: new Date(
      Date.now() + DOCTOR_CHAT_TYPING_WINDOW_MS,
    ).toISOString(),
  };
  await chat.save();
  return chat;
}

function countDoctorChatUnreadMessages(chat, user) {
  const viewerType = getDoctorChatViewerType(user);
  const messages = Array.isArray(chat?.messages) ? chat.messages : [];

  return messages.filter((message) => {
    if (!message || message.senderType === viewerType) {
      return false;
    }

    return !normalizeDoctorChatReadBy(message.readBy).includes(viewerType);
  }).length;
}

async function markDoctorChatMessagesSeen(chat, user, { persist = true } = {}) {
  const viewerType = getDoctorChatViewerType(user);
  const messages = Array.isArray(chat?.messages) ? chat.messages : [];
  let changed = false;

  const nextMessages = messages.map((message) => {
    if (!message || message.senderType === viewerType) {
      return message;
    }

    const readBy = normalizeDoctorChatReadBy(message.readBy);
    if (readBy.includes(viewerType)) {
      return {
        ...message,
        readBy,
      };
    }

    changed = true;
    return {
      ...message,
      readBy: [...readBy, viewerType],
    };
  });

  if (!changed) {
    return chat;
  }

  chat.messages = nextMessages;
  if (persist) {
    await chat.save();
  }
  return chat;
}

function buildDoctorChatPayload(chat, doctor, patient, user = null) {
  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  const lastMessage = messages[messages.length - 1] || null;

  return {
    id: chat.id,
    patientId: chat.patientId,
    doctorId: chat.doctorId,
    subject: chat.subject || '',
    status: chat.status || 'active',
    lastMessageAt: chat.lastMessageAt || lastMessage?.createdAt || null,
    doctor: doctor ? getSafeDoctor(doctor) : null,
    patient: patient ? getSafePatientSummary(patient) : null,
    unreadCount: user ? countDoctorChatUnreadMessages(chat, user) : 0,
    typingIndicator: user ? getDoctorChatTypingIndicator(chat, user) : null,
    messages,
    lastMessage,
  };
}

async function findDoctorChatByParticipants(patientId, doctorId) {
  const chats = await scanModelByField(DoctorChat, 'patientId', patientId);

  return (
    chats.find(
      (chat) => chat.patientId === patientId && chat.doctorId === doctorId,
    ) || null
  );
}

function canAccessDoctorChat(user, chat) {
  if (!user || !chat) {
    return false;
  }

  return isDoctorAccount(user)
    ? chat.doctorId === user.id
    : chat.patientId === user.id;
}

async function buildDoctorChatPayloads(chats = [], user = null) {
  const chatList = Array.isArray(chats) ? chats : [];
  const doctors = await ensureDoctorsSeeded();
  const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const patientIds = [
    ...new Set(chatList.map((chat) => chat.patientId).filter(Boolean)),
  ];
  const patients = await Promise.all(
    patientIds.map(async (patientId) => {
      try {
        return await findPatientById(patientId);
      } catch (error) {
        console.error(
          `Doctor chat patient lookup failed for ${patientId}:`,
          error,
        );
        return null;
      }
    }),
  );
  const patientMap = new Map(
    patients.filter(Boolean).map((patient) => [patient.id, patient]),
  );

  return chatList.map((chat) =>
    buildDoctorChatPayload(
      chat,
      doctorMap.get(chat.doctorId),
      patientMap.get(chat.patientId),
      user,
    ),
  );
}

function getDoctorChatStreamKey(user) {
  if (!user?.id) {
    return '';
  }

  return `${getDoctorChatViewerType(user)}:${user.id}`;
}

function registerDoctorChatStreamClient(user, res) {
  const key = getDoctorChatStreamKey(user);
  if (!key) {
    return () => {};
  }

  const clients = doctorChatStreamClients.get(key) || new Set();
  clients.add(res);
  doctorChatStreamClients.set(key, clients);

  return () => {
    const currentClients = doctorChatStreamClients.get(key);
    if (!currentClients) {
      return;
    }

    currentClients.delete(res);
    if (currentClients.size === 0) {
      doctorChatStreamClients.delete(key);
    }
  };
}

async function broadcastDoctorChatEvent(chat) {
  if (!chat?.id) {
    return;
  }

  const targets = [
    {
      key: `patient:${chat.patientId}`,
      userType: 'patient',
    },
    {
      key: `doctor:${chat.doctorId}`,
      userType: 'doctor',
    },
  ].filter((target) => {
    const clients = doctorChatStreamClients.get(target.key);
    return target.key && clients && clients.size > 0;
  });

  if (targets.length === 0) {
    return;
  }

  const [doctor, patient] = await Promise.all([
    findDoctorById(chat.doctorId),
    findPatientById(chat.patientId),
  ]);

  for (const target of targets) {
    const clients = doctorChatStreamClients.get(target.key);
    if (!clients || clients.size === 0) {
      continue;
    }

    const targetUser = target.userType === 'doctor' ? doctor : patient;
    if (!targetUser) {
      continue;
    }

    const payload = JSON.stringify({
      type: 'chat-updated',
      chat: buildDoctorChatPayload(chat, doctor, patient, targetUser),
    });

    for (const client of clients) {
      try {
        client.write(`event: doctor-chat\n`);
        client.write(`data: ${payload}\n\n`);
      } catch (_error) {
        // Broken streams are cleaned up on connection close.
      }
    }
  }
}

function normalizeTranscriptStatus(rawValue = '') {
  const value = String(rawValue || '')
    .trim()
    .toLowerCase();

  if (value === 'completed' || value === 'ended') {
    return 'completed';
  }

  return 'active';
}

async function resolveDoctorChatPartiesForUser(chat, user) {
  if (isDoctorAccount(user)) {
    return {
      doctor: user,
      patient: await findPatientById(chat.patientId),
    };
  }

  return {
    doctor: await findDoctorById(chat.doctorId),
    patient: user,
  };
}

function normalizeConsultationType(rawValue = '') {
  const value = String(rawValue || '')
    .trim()
    .toLowerCase();

  return value || 'video';
}

function normalizeTranscriptText(rawValue = '') {
  return String(rawValue || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeIsoTimestamp(rawValue, fallback = new Date().toISOString()) {
  const candidate = rawValue || fallback;
  const parsed = new Date(candidate);

  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toISOString();
}

function normalizeTranscriptEntry(input = {}) {
  const text = normalizeTranscriptText(input.text || input.message || '');
  if (!text) {
    return null;
  }

  return {
    id: String(input.id || uuidv4())
      .trim()
      .slice(0, 120),
    speakerIdentity: String(input.speakerIdentity || input.from || '')
      .trim()
      .slice(0, 120),
    speakerName:
      String(input.speakerName || input.fromLabel || 'Participant')
        .trim()
        .slice(0, 120) || 'Participant',
    speakerUserId: String(input.speakerUserId || '')
      .trim()
      .slice(0, 120),
    source:
      String(input.source || 'manual')
        .trim()
        .toLowerCase()
        .slice(0, 24) || 'manual',
    text,
    at: normalizeIsoTimestamp(input.at),
  };
}

function normalizeTranscriptParticipant(input = {}) {
  const identity = String(input.identity || input.participantIdentity || '')
    .trim()
    .slice(0, 120);
  const name = String(input.name || input.participantName || input.label || '')
    .trim()
    .slice(0, 120);
  const userId = String(input.userId || '')
    .trim()
    .slice(0, 120);

  if (!identity && !userId && !name) {
    return null;
  }

  return {
    identity,
    name: name || 'Participant',
    userId,
    accountType: String(input.accountType || '')
      .trim()
      .toLowerCase()
      .slice(0, 32),
    isLocal: Boolean(input.isLocal),
    joinedAt: input.joinedAt
      ? normalizeIsoTimestamp(input.joinedAt)
      : undefined,
    leftAt: input.leftAt ? normalizeIsoTimestamp(input.leftAt) : undefined,
  };
}

function buildTranscriptParticipantFromUser(user, identity = '', name = '') {
  return normalizeTranscriptParticipant({
    identity,
    name: name || user?.name || 'Participant',
    userId: user?.id || '',
    accountType: user?.accountType || 'patient',
    isLocal: true,
    joinedAt: new Date().toISOString(),
  });
}

function mergeTranscriptEntries(existingEntries = [], incomingEntries = []) {
  const entryMap = new Map();

  [...existingEntries, ...incomingEntries].forEach((entry) => {
    const normalized = normalizeTranscriptEntry(entry);
    if (!normalized) {
      return;
    }

    const key =
      normalized.id || `${normalized.speakerIdentity}-${normalized.at}`;
    const current = entryMap.get(key) || {};
    entryMap.set(key, { ...current, ...normalized });
  });

  return Array.from(entryMap.values()).sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

function mergeTranscriptParticipants(
  existingParticipants = [],
  incomingParticipants = [],
) {
  const participantMap = new Map();

  [...existingParticipants, ...incomingParticipants].forEach((participant) => {
    const normalized = normalizeTranscriptParticipant(participant);
    if (!normalized) {
      return;
    }

    const key =
      normalized.identity || normalized.userId || normalized.name.toLowerCase();
    const current = participantMap.get(key) || {};

    participantMap.set(key, {
      ...current,
      ...normalized,
      name: normalized.name || current.name || 'Participant',
      joinedAt: current.joinedAt || normalized.joinedAt || undefined,
      leftAt: normalized.leftAt || current.leftAt || undefined,
    });
  });

  return Array.from(participantMap.values());
}

function mergeTranscriptUsers(existingUsers = [], user) {
  const nextUsers = Array.isArray(existingUsers) ? [...existingUsers] : [];

  if (!user?.id) {
    return nextUsers;
  }

  const normalized = {
    userId: user.id,
    name: user.name || 'Patient',
    email: user.email || '',
    accountType: user.accountType || 'patient',
    joinedAt: new Date().toISOString(),
  };

  const existingIndex = nextUsers.findIndex(
    (entry) => entry?.userId === normalized.userId,
  );

  if (existingIndex >= 0) {
    nextUsers[existingIndex] = {
      ...nextUsers[existingIndex],
      ...normalized,
      joinedAt: nextUsers[existingIndex]?.joinedAt || normalized.joinedAt,
    };
    return nextUsers;
  }

  return [...nextUsers, normalized];
}

function buildTranscriptSummary(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const normalized = normalizeTranscriptEntry(entry);
      if (!normalized) {
        return '';
      }

      return `${normalized.speakerName}: ${normalized.text}`;
    })
    .filter(Boolean)
    .join('\n')
    .slice(0, 8000);
}

function buildConsultationTranscriptPayload(transcript) {
  return {
    id: transcript.id,
    roomName: transcript.roomName,
    consultationType: transcript.consultationType || 'video',
    status: transcript.status || 'active',
    createdByUserId: transcript.createdByUserId || '',
    lastSavedByUserId: transcript.lastSavedByUserId || '',
    startedAt: transcript.startedAt || null,
    endedAt: transcript.endedAt || null,
    users: Array.isArray(transcript.users) ? transcript.users : [],
    participants: Array.isArray(transcript.participants)
      ? transcript.participants
      : [],
    entries: Array.isArray(transcript.entries) ? transcript.entries : [],
    summary: transcript.summary || '',
    createdAt: transcript.createdAt || null,
    updatedAt: transcript.updatedAt || null,
  };
}

async function findConsultationTranscriptByRoom(roomName) {
  const transcripts = await scanModelByField(
    ConsultationTranscript,
    'roomName',
    roomName,
  );

  return (
    (Array.isArray(transcripts) ? transcripts : []).sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime(),
    )[0] || null
  );
}

function getSafeUser(user) {
  if ((user?.accountType || '').toLowerCase() === 'doctor') {
    return {
      ...getSafeDoctor(user),
      email: user.email,
      authType: user.authType,
      onboarding: user.onboarding || defaultDoctorOnboarding(),
      isPremium: false,
      notificationSettings:
        user.notificationSettings || defaultNotificationSettings(),
      profile: {
        ...defaultDoctorProfile(),
        ...(user.profile || {}),
      },
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
    };
  }

  return {
    id: user.id,
    accountType: user.accountType || 'patient',
    name: user.name || '',
    email: user.email,
    avatar: buildDeliveredAvatarValue(
      user.avatar || '',
      user.name || user.email || 'Patient',
      user.updatedAt || user.createdAt || '',
    ),
    authType: user.authType,
    onboarding: user.onboarding || {},
    isPremium: Boolean(user.isPremium),
    notificationSettings:
      user.notificationSettings || defaultNotificationSettings(),
    profile: {
      ...defaultUserProfile(),
      ...(user.profile || {}),
    },
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function normalizeAccountType(rawValue = '', fallback = 'patient') {
  const value = String(rawValue || '')
    .trim()
    .toLowerCase();
  if (value === 'doctor' || value === 'patient') {
    return value;
  }
  return fallback;
}

async function clearModelRecords(Model) {
  const records = await Model.scan().exec();
  const items = Array.isArray(records) ? records : [];

  for (const record of items) {
    if (record && typeof record.delete === 'function') {
      await record.delete();
    }
  }

  return items.length;
}

function isDoctorAccount(userOrAccountType) {
  if (typeof userOrAccountType === 'string') {
    return normalizeAccountType(userOrAccountType, 'patient') === 'doctor';
  }

  return (
    normalizeAccountType(userOrAccountType?.accountType, 'patient') === 'doctor'
  );
}

function normalizeEmailValue(email = '') {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function valuesMatch(left, right) {
  if (typeof left === 'string' && typeof right === 'string') {
    return left.trim().toLowerCase() === right.trim().toLowerCase();
  }

  return left === right;
}

function isDynamoResourceNotFoundError(error) {
  const code = String(error?.code || error?.name || error?.__type || '')
    .trim()
    .toLowerCase();
  const message = String(error?.message || '')
    .trim()
    .toLowerCase();

  return (
    code.includes('resourcenotfound') ||
    message.includes('requested resource not found') ||
    message.includes('cannot do operations on a non-existent table')
  );
}

async function scanModelByField(Model, field, value) {
  const records = await Model.scan().exec();
  return (Array.isArray(records) ? records : []).filter((record) =>
    valuesMatch(record?.[field], value),
  );
}

async function findLegacyUserByEmail(email) {
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) {
    return null;
  }

  try {
    const users = await scanModelByField(LegacyUser, 'email', normalizedEmail);
    return users[0] || null;
  } catch (error) {
    if (isDynamoResourceNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

async function promoteLegacyUserToPatient(legacyUser) {
  if (!legacyUser) {
    return null;
  }

  const normalizedEmail = normalizeEmailValue(legacyUser.email);
  const patient = new Patient({
    id: legacyUser.id || uuidv4(),
    name: legacyUser.name || '',
    email: normalizedEmail,
    authType: legacyUser.authType || 'EMAIL',
    accountType: 'patient',
    password: legacyUser.password || '',
    onboarding: {
      ...(legacyUser.onboarding || {}),
    },
    profile: {
      ...defaultUserProfile(),
      ...(legacyUser.profile || {}),
    },
    isPremium: Boolean(legacyUser.isPremium),
    notificationSettings:
      legacyUser.notificationSettings || defaultNotificationSettings(),
    appointments: Array.isArray(legacyUser.appointments)
      ? legacyUser.appointments
      : buildDefaultAppointments(),
    notifications: Array.isArray(legacyUser.notifications)
      ? legacyUser.notifications
      : buildDefaultNotifications(),
    vitals: Array.isArray(legacyUser.vitals)
      ? legacyUser.vitals
      : buildDefaultVitals(),
    labResults: Array.isArray(legacyUser.labResults)
      ? legacyUser.labResults
      : buildDefaultLabResults(),
    documents: Array.isArray(legacyUser.documents)
      ? legacyUser.documents
      : buildDefaultDocuments(),
    vaccinations: Array.isArray(legacyUser.vaccinations)
      ? legacyUser.vaccinations
      : buildDefaultVaccinations(),
  });

  await patient.save();
  console.info(
    `[auth] Migrated legacy User record for ${normalizedEmail} into Patient.`,
  );
  return patient;
}

async function findPatientByEmail(email) {
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) {
    return null;
  }

  const users = await scanModelByField(Patient, 'email', normalizedEmail);
  const patient = users[0] || null;
  if (patient) {
    return patient;
  }

  const legacyUser = await findLegacyUserByEmail(normalizedEmail);
  if (!legacyUser) {
    return null;
  }

  return promoteLegacyUserToPatient(legacyUser);
}

async function findDoctorByEmail(email, { seed = false } = {}) {
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) {
    return null;
  }

  if (seed) {
    await ensureDoctorsSeeded();
  }

  const doctors = await scanModelByField(Doctor, 'email', normalizedEmail);
  return doctors[0] || null;
}

async function findUserByEmail(email, accountType = '') {
  const normalizedEmail = normalizeEmailValue(email);
  const nextAccountType = normalizeAccountType(accountType, '');

  if (!normalizedEmail) {
    return null;
  }

  if (nextAccountType === 'doctor') {
    return findDoctorByEmail(normalizedEmail, { seed: true });
  }

  if (nextAccountType === 'patient') {
    return findPatientByEmail(normalizedEmail);
  }

  const patient = await findPatientByEmail(normalizedEmail);
  if (patient) {
    return patient;
  }

  return findDoctorByEmail(normalizedEmail, { seed: true });
}

async function findUserByPasswordResetTokenHash(tokenHash) {
  if (!tokenHash) {
    return null;
  }

  const patientUsers = await scanModelByField(
    Patient,
    'passwordResetTokenHash',
    tokenHash,
  );
  if (patientUsers[0]) {
    return patientUsers[0];
  }

  const doctorUsers = await scanModelByField(
    Doctor,
    'passwordResetTokenHash',
    tokenHash,
  );

  return doctorUsers[0] || null;
}

async function hydratePatientUser(user) {
  if (!Array.isArray(user.appointments) || user.appointments.length === 0) {
    user.appointments = buildDefaultAppointments();
  }
  if (!Array.isArray(user.notifications) || user.notifications.length === 0) {
    user.notifications = buildDefaultNotifications();
  }
  if (!Array.isArray(user.vitals) || user.vitals.length === 0) {
    user.vitals = buildDefaultVitals();
  }
  if (!Array.isArray(user.labResults) || user.labResults.length === 0) {
    user.labResults = buildDefaultLabResults();
  }
  if (!Array.isArray(user.documents) || user.documents.length === 0) {
    user.documents = buildDefaultDocuments();
  }
  if (!Array.isArray(user.vaccinations) || user.vaccinations.length === 0) {
    user.vaccinations = buildDefaultVaccinations();
  }
  if (!user.notificationSettings) {
    user.notificationSettings = defaultNotificationSettings();
  }
  if (!user.onboarding) {
    user.onboarding = {};
  }
  user.onboarding.language = normalizeLanguage(user.onboarding.language);
  if (!user.profile || typeof user.profile !== 'object') {
    user.profile = defaultUserProfile();
  } else {
    user.profile = {
      ...defaultUserProfile(),
      ...user.profile,
    };
  }

  await user.save();
  return user;
}

async function hydrateDoctorUser(user) {
  if (!user.onboarding || typeof user.onboarding !== 'object') {
    user.onboarding = defaultDoctorOnboarding();
  } else {
    user.onboarding = {
      ...defaultDoctorOnboarding(user.onboarding.language),
      ...user.onboarding,
      onboardingCompleted: Boolean(user.onboarding.onboardingCompleted),
      language: normalizeLanguage(user.onboarding.language),
    };
  }

  user.notificationSettings =
    user.notificationSettings || defaultNotificationSettings();
  user.profile = {
    ...defaultDoctorProfile(),
    ...(user.profile || {}),
  };
  user.title = user.title || 'Doctor';
  user.specialty = user.specialty || 'General Medicine';
  if (typeof user.isSpecialist !== 'boolean') {
    user.isSpecialist = inferDoctorIsSpecialist({
      title: user.title,
      specialty: user.specialty,
    });
  }
  user.status = user.status || 'available';
  user.responseTime = user.responseTime || 'Usually responds within 30 minutes';
  user.nextAvailable = user.nextAvailable || 'Today';
  user.consultationModes =
    Array.isArray(user.consultationModes) && user.consultationModes.length > 0
      ? user.consultationModes
      : ['doctor_chat', 'video'];
  user.languages = Array.isArray(user.languages) ? user.languages : [];

  await user.save();
  return user;
}

async function hydrateUser(user) {
  if (!user) {
    return null;
  }

  if (isDoctorAccount(user)) {
    return hydrateDoctorUser(user);
  }

  return hydratePatientUser(user);
}

function buildDashboard(user) {
  const upcomingAppointments = (user.appointments || []).filter(
    (item) => !item.isPast,
  );
  const recentVitals = (user.vitals || []).slice(0, 3);

  return {
    tip: {
      title: "Today's Health Tip",
      body: 'Drinking 2-3 liters of water daily supports healthy blood pressure and kidney function.',
      date: todayLabel(),
    },
    womensStage: user.onboarding?.womensStage || 'general',
    pregnancyWeeks: user.onboarding?.pregnancyWeeks || '',
    isPremium: Boolean(user.isPremium),
    services: [
      {
        title: 'Consult a Doctor',
        icon: 'doctor',
        color: '#2563eb',
        bg: '#eff6ff',
        actionId: 'consult_doctor',
        description: 'Browse general doctors and start a direct consultation.',
      },
      {
        title: 'Consult a Specialist',
        icon: 'stethoscope',
        color: '#3b82f6',
        bg: '#eff6ff',
        actionId: 'consult_specialist',
        description:
          'Connect with specialist doctors for focused care and follow-up.',
      },
      {
        title: 'Chat with a Doctor',
        icon: 'message-text-outline',
        color: '#1d4ed8',
        bg: '#eff6ff',
        actionId: 'doctor_chat',
        description:
          'Send your concerns directly to a doctor and continue the conversation in-app.',
      },
      {
        title: 'Health Records',
        icon: 'folder-heart-outline',
        color: '#1e40af',
        bg: '#eff6ff',
        actionId: 'records',
        description:
          'Review your reports, lab results, and saved health files.',
      },
    ],
    articles: [
      {
        title: 'Managing Stress in Busy Lagos Life',
        category: 'Mental Health',
        image:
          'https://images.unsplash.com/photo-1518644961665-ed172691bb7e?w=400',
      },
      {
        title: 'Why Blood Pressure Matters After 40',
        category: 'Cardiology',
        image:
          'https://images.unsplash.com/photo-1579684384363-3f4e6b7e3e4e?w=400',
      },
    ],
    upcomingAppointments,
    recentVitals,
  };
}

function buildReports(user) {
  return {
    womensStage: user.onboarding?.womensStage || 'general',
    pregnancyWeeks: user.onboarding?.pregnancyWeeks || '',
    overview: {
      avgHeartRate: '92 bpm',
      bloodPressure: '118/78',
      weight: '79.8 kg',
      hydration: '68%',
    },
    labResults: user.labResults || [],
    documents: user.documents || [],
    vaccinations: user.vaccinations || [],
  };
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function isLikelyGoogleApiKey(value = '') {
  const key = value.trim();
  return key.startsWith('AIza') && key.length >= 20;
}

function getGeminiApiKey() {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GEMINI_API_KEY,
    process.env.GOOGLE_CLIENT_ID,
  ]
    .map((value) => (value || '').trim())
    .filter(Boolean);

  if (candidates.length === 0) {
    return '';
  }

  const googleApiKey = candidates.find((value) => isLikelyGoogleApiKey(value));
  return googleApiKey || '';
}

function toGeminiRole(role) {
  return role === 'assistant' ? 'model' : 'user';
}

function normalizeGeminiModelName(modelName = '') {
  const trimmed = (modelName || '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('models/')
    ? trimmed.slice('models/'.length)
    : trimmed;
}

function parseGeminiError(data) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const errorMessage = data?.error?.message;
  if (typeof errorMessage === 'string' && errorMessage.trim()) {
    return errorMessage.trim();
  }

  const firstDetail = data?.error?.details?.[0]?.message;
  if (typeof firstDetail === 'string' && firstDetail.trim()) {
    return firstDetail.trim();
  }

  return '';
}

function resolveAuthToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  const queryToken = String(req.query?.token || '').trim();
  return queryToken || null;
}

function authRequired(req, res, next) {
  const token = resolveAuthToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function isAwsCredentialError(error) {
  const name = (error?.name || '').toString();
  const message = (error?.message || '').toString().toLowerCase();

  return (
    name === 'UnrecognizedClientException' ||
    name === 'InvalidSignatureException' ||
    message.includes('security token included in the request is invalid') ||
    message.includes('the security token') ||
    message.includes('unrecognizedclientexception')
  );
}

function isTimeoutError(error) {
  const name = String(error?.name || '')
    .trim()
    .toLowerCase();
  const code = String(error?.code || '')
    .trim()
    .toLowerCase();
  const message = String(error?.message || '')
    .trim()
    .toLowerCase();

  return (
    code === 'etimedout' ||
    code === 'request_timeout' ||
    code === 'timeouterror' ||
    name.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('timeout')
  );
}

function buildInformativeRouteFallback(fallbackMessage = '') {
  const normalized = String(fallbackMessage || '').trim();
  if (!normalized) {
    return 'We could not complete this request right now. Please try again. If it keeps happening, check the backend logs and service configuration.';
  }

  if (normalized === 'Server error. Please try again later.') {
    return 'We could not complete this request right now. Please try again. If it keeps happening, check the backend logs and service configuration.';
  }

  if (/^failed to /i.test(normalized)) {
    const action = normalized.replace(/^failed to /i, '').trim();
    return `We could not ${action} right now. Please try again. If it keeps happening, check the backend logs and service configuration.`;
  }

  if (/^unable to /i.test(normalized)) {
    return `${normalized} Please try again in a moment.`;
  }

  return `${normalized} Please try again in a moment.`;
}

function sendRouteError(
  res,
  error,
  fallbackMessage = 'Server error. Please try again later.',
) {
  if (
    Number.isInteger(error?.statusCode) &&
    error.statusCode >= 400 &&
    error.exposeMessage === true &&
    typeof error?.message === 'string' &&
    error.message.trim()
  ) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message.trim(),
    });
  }

  if (isAwsCredentialError(error)) {
    return res.status(503).json({
      success: false,
      message:
        'Database credentials are invalid. Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY on the backend.',
    });
  }

  if (isDynamoResourceNotFoundError(error)) {
    return res.status(503).json({
      success: false,
      message:
        'Database tables are missing or not initialized. Connect the backend to the correct DynamoDB tables and try again.',
    });
  }

  if (isTimeoutError(error)) {
    return res.status(504).json({
      success: false,
      message:
        'The request took too long while contacting a required service. Please try again.',
    });
  }

  return res.status(500).json({
    success: false,
    message: buildInformativeRouteFallback(fallbackMessage),
  });
}

async function getAuthedUser(req) {
  const tokenEmail = (req.auth?.email || '').toLowerCase();
  if (!tokenEmail) {
    return null;
  }

  const user = await findUserByEmail(
    tokenEmail,
    normalizeAccountType(req.auth?.accountType, 'patient'),
  );
  if (!user) {
    return null;
  }

  return hydrateUser(user);
}

router.post(
  '/auth/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('accountType')
      .optional()
      .isIn(['patient', 'doctor'])
      .withMessage('Account type must be patient or doctor'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const accountType = normalizeAccountType(
        req.body?.accountType,
        'patient',
      );
      const normalizedEmail = email.toLowerCase().trim();
      const [existingPatient, existingDoctor] = await Promise.all([
        findPatientByEmail(normalizedEmail),
        findDoctorByEmail(normalizedEmail, { seed: true }),
      ]);

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      let newUser;

      if (accountType === 'doctor') {
        if (existingPatient) {
          return res.status(409).json({
            success: false,
            message: 'User with this email already exists',
          });
        }

        const claimableDoctor =
          existingDoctor && !existingDoctor.password && !existingDoctor.authType
            ? existingDoctor
            : null;

        if (existingDoctor && !claimableDoctor) {
          return res.status(409).json({
            success: false,
            message: 'User with this email already exists',
          });
        }

        newUser =
          claimableDoctor ||
          new Doctor({
            id: uuidv4(),
            email: normalizedEmail,
            accountType: 'doctor',
          });

        newUser.name = name.trim();
        newUser.email = normalizedEmail;
        newUser.authType = 'EMAIL';
        newUser.password = hashedPassword;
        newUser.onboarding = {
          ...(claimableDoctor?.onboarding || {}),
          ...defaultDoctorOnboarding(req.body?.language),
          onboardingCompleted: false,
        };
        newUser.profile = {
          ...defaultDoctorProfile(),
          ...(claimableDoctor?.profile || {}),
          ...sanitizeDoctorProfilePayload(req.body?.profile || req.body),
        };
        newUser.notificationSettings =
          claimableDoctor?.notificationSettings ||
          defaultNotificationSettings();
        const doctorTitle =
          toOptionalString(req.body?.title) ||
          claimableDoctor?.title ||
          'Doctor';
        const doctorSpecialty =
          toOptionalString(req.body?.specialty) ||
          claimableDoctor?.specialty ||
          'General Medicine';
        newUser.title = doctorTitle;
        newUser.specialty = doctorSpecialty;
        if (typeof req.body?.isSpecialist === 'boolean') {
          newUser.isSpecialist = req.body.isSpecialist;
        } else {
          newUser.isSpecialist = inferDoctorIsSpecialist({
            title: doctorTitle,
            specialty: doctorSpecialty,
          });
        }
        newUser.bio =
          toOptionalString(req.body?.bio) || claimableDoctor?.bio || '';
        newUser.languages =
          Array.isArray(req.body?.languages) && req.body.languages.length > 0
            ? normalizeDoctorLanguageList(
                req.body.languages,
                req.body?.language,
              )
            : Array.isArray(claimableDoctor?.languages) &&
                claimableDoctor.languages.length > 0
              ? claimableDoctor.languages
              : normalizeDoctorLanguageList([], req.body?.language);
        newUser.consultationModes =
          Array.isArray(claimableDoctor?.consultationModes) &&
          claimableDoctor.consultationModes.length > 0
            ? claimableDoctor.consultationModes
            : ['doctor_chat', 'video'];
        newUser.status = claimableDoctor?.status || 'available';
        newUser.responseTime =
          toOptionalString(req.body?.responseTime) ||
          claimableDoctor?.responseTime ||
          'Usually responds within 30 minutes';
        newUser.nextAvailable =
          toOptionalString(req.body?.nextAvailable) ||
          claimableDoctor?.nextAvailable ||
          'Today';
        newUser.priceLabel =
          toOptionalString(req.body?.priceLabel) ||
          claimableDoctor?.priceLabel ||
          'By consultation';

        const yearsExperience = Number(req.body?.yearsExperience);
        if (Number.isFinite(yearsExperience) && yearsExperience >= 0) {
          newUser.yearsExperience = yearsExperience;
        } else if (typeof claimableDoctor?.yearsExperience === 'number') {
          newUser.yearsExperience = claimableDoctor.yearsExperience;
        } else {
          newUser.yearsExperience = 0;
        }
      } else {
        if (existingPatient || existingDoctor) {
          return res.status(409).json({
            success: false,
            message: 'User with this email already exists',
          });
        }

        newUser = new Patient({
          id: uuidv4(),
          name: name.trim(),
          email: normalizedEmail,
          authType: 'EMAIL',
          accountType: 'patient',
          password: hashedPassword,
          onboarding: { onboardingCompleted: false },
          profile: defaultUserProfile(),
          isPremium: false,
          notificationSettings: defaultNotificationSettings(),
          appointments: buildDefaultAppointments(),
          notifications: buildDefaultNotifications(),
          vitals: buildDefaultVitals(),
          labResults: buildDefaultLabResults(),
          documents: buildDefaultDocuments(),
          vaccinations: buildDefaultVaccinations(),
        });
      }

      await newUser.save();

      const token = jwt.sign(
        {
          userId: newUser.id,
          email: normalizedEmail,
          authType: newUser.authType,
          accountType: newUser.accountType,
        },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: getSafeUser(newUser),
      });
    } catch (error) {
      console.error('Signup error:', error);
      return sendRouteError(res, error);
    }
  },
);

router.post(
  '/auth/signin',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('accountType')
      .optional()
      .isIn(['patient', 'doctor'])
      .withMessage('Account type must be patient or doctor'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const requestedLanguage = getRequestedLanguage(req);

    try {
      const accountType = normalizeAccountType(req.body?.accountType, '');
      const normalizedEmail = email.toLowerCase().trim();
      const user = await findUserByEmail(normalizedEmail, accountType);
      const responseLanguage = normalizeLanguage(
        requestedLanguage || user?.onboarding?.language || 'en',
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: translateServerText(responseLanguage, 'User not found'),
        });
      }

      if (user.authType !== 'EMAIL' || !user.password) {
        return res.status(401).json({
          success: false,
          message: translateServerText(
            responseLanguage,
            'Invalid email or password',
          ),
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: translateServerText(
            responseLanguage,
            'Invalid email or password',
          ),
        });
      }

      await hydrateUser(user);

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          authType: user.authType,
          accountType: user.accountType || 'patient',
        },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      return res.status(200).json({
        success: true,
        message: translateServerText(responseLanguage, 'Sign in successful'),
        token,
        user: getSafeUser(user),
      });
    } catch (error) {
      console.error('Signin error:', error);
      return sendRouteError(res, error);
    }
  },
);

router.post(
  '/auth/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const requestedLanguage = getRequestedLanguage(req);
      const accountType = normalizeAccountType(req.body?.accountType, '');
      const normalizedEmail = req.body.email.toLowerCase().trim();
      const user = await findUserByEmail(normalizedEmail, accountType);
      const responseLanguage = normalizeLanguage(
        requestedLanguage || user?.onboarding?.language || 'en',
      );

      if (!user || user.authType !== 'EMAIL') {
        return res.status(404).json({
          success: false,
          message: translateServerText(responseLanguage, 'User not found'),
        });
      }

      const { rawToken, tokenHash, expiresAt } = createPasswordResetToken();
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = expiresAt;
      user.passwordResetRequestedAt = new Date().toISOString();
      await user.save();

      const webBaseUrl = getPasswordResetWebBaseUrl(req);
      const webResetLink = `${webBaseUrl}/auth/reset-password?token=${encodeURIComponent(
        rawToken,
      )}`;
      const emailPayload = buildPasswordResetEmail({
        user,
        webResetLink,
        language: responseLanguage,
      });

      let mailSent = false;
      try {
        if (isMailerConfigured()) {
          await sendMail({
            to: user.email,
            subject: emailPayload.subject,
            text: emailPayload.text,
            html: emailPayload.html,
          });
          mailSent = true;
        } else if (!isProductionRuntime()) {
          console.info(
            `[auth] Password reset email not sent because SMTP is not configured. Reset link for ${user.email}: ${webResetLink}`,
          );
        }
      } catch (mailError) {
        console.error('Forgot password email error:', mailError);
        if (!isProductionRuntime()) {
          console.info(
            `[auth] Password reset email delivery failed. Reset link for ${user.email}: ${webResetLink}`,
          );
        }
      }

      const responseBody = {
        success: true,
        message: translateServerText(
          responseLanguage,
          'If an account with that email exists, a password reset link has been sent.',
        ),
      };
      if (!isProductionRuntime()) {
        responseBody.debug = {
          resetToken: rawToken,
          resetLink: webResetLink,
          mailSent,
        };
      }

      return res.status(200).json(responseBody);
    } catch (error) {
      console.error('Forgot password error:', error);
      return sendRouteError(res, error, 'Failed to start password reset flow');
    }
  },
);

router.get('/auth/reset-password/validate', async (req, res) => {
  try {
    const requestedLanguage = getRequestedLanguage(req);
    const token = String(req.query.token || '').trim();
    if (!token) {
      return res.status(400).json({
        success: false,
        message: translateServerText(
          requestedLanguage,
          'Reset token is required',
        ),
      });
    }

    const user = await findUserByPasswordResetTokenHash(
      hashPasswordResetToken(token),
    );
    const responseLanguage = normalizeLanguage(
      requestedLanguage || user?.onboarding?.language || 'en',
    );

    if (!user || !isPasswordResetTokenStillValid(user)) {
      return res.status(400).json({
        success: false,
        message: translateServerText(
          responseLanguage,
          'Reset link is invalid or has expired.',
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: translateServerText(responseLanguage, 'Reset token is valid.'),
    });
  } catch (error) {
    console.error('Reset password validation error:', error);
    return sendRouteError(
      res,
      error,
      'Failed to validate reset password token',
    );
  }
});

router.post(
  '/auth/reset-password',
  [
    body('token').trim().notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const token = String(req.body.token || '').trim();
    const nextPassword = String(req.body.password || '');
    const requestedLanguage = getRequestedLanguage(req);

    try {
      const user = await findUserByPasswordResetTokenHash(
        hashPasswordResetToken(token),
      );
      const responseLanguage = normalizeLanguage(
        requestedLanguage || user?.onboarding?.language || 'en',
      );

      if (!user || !isPasswordResetTokenStillValid(user)) {
        return res.status(400).json({
          success: false,
          message: translateServerText(
            responseLanguage,
            'Reset link is invalid or has expired.',
          ),
        });
      }

      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(nextPassword, salt);
      clearPasswordResetState(user);
      await user.save();

      return res.status(200).json({
        success: true,
        message: translateServerText(
          responseLanguage,
          'Password reset successful. You can now sign in.',
        ),
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return sendRouteError(res, error, 'Failed to reset password');
    }
  },
);

router.get('/auth/me', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user: getSafeUser(user) });
  } catch (error) {
    console.error('Get me error:', error);
    return sendRouteError(res, error, 'Failed to load profile');
  }
});

router.post('/admin/dev/clear-database', authRequired, async (req, res) => {
  const requestedLanguage = getRequestedLanguage(req);
  const responseLanguage = normalizeLanguage(requestedLanguage || 'en');

  if (isProductionRuntime() && !allowProductionDatabaseClear()) {
    return res.status(404).json({
      success: false,
      message: translateServerText(responseLanguage, 'Not found'),
    });
  }

  const productionRequested =
    req.body?.production === true ||
    String(req.body?.production || '')
      .trim()
      .toLowerCase() === 'true';

  if (isProductionRuntime() && !productionRequested) {
    return res.status(400).json({
      success: false,
      message: translateServerText(
        responseLanguage,
        'Tick the production checkbox before clearing the live app database.',
      ),
    });
  }

  const confirmation = String(
    req.body?.confirmation || req.headers['x-dev-reset-confirmation'] || '',
  ).trim();

  if (confirmation !== DEV_DATABASE_RESET_CONFIRMATION) {
    return res.status(400).json({
      success: false,
      message: translateServerText(
        responseLanguage,
        isProductionRuntime()
          ? `Type "${DEV_DATABASE_RESET_CONFIRMATION}" to clear the production app database.`
          : `Type "${DEV_DATABASE_RESET_CONFIRMATION}" to clear the app database.`,
      ),
    });
  }

  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: translateServerText(responseLanguage, 'User not found'),
      });
    }

    const models = [
      ['patients', Patient],
      ['doctors', Doctor],
      ['doctorChats', DoctorChat],
      ['consultationTranscripts', ConsultationTranscript],
      ['legacyUsers', LegacyUser],
    ];

    const cleared = {};
    for (const [label, Model] of models) {
      cleared[label] = await clearModelRecords(Model);
    }

    return res.status(200).json({
      success: true,
      message: translateServerText(responseLanguage, 'App database cleared.'),
      confirmation: DEV_DATABASE_RESET_CONFIRMATION,
      cleared,
      environment: isProductionRuntime() ? 'production' : 'development',
      production: productionRequested,
      note: translateServerText(
        responseLanguage,
        'Seeded sample doctors may reappear the next time the doctor directory seeds defaults.',
      ),
    });
  } catch (error) {
    console.error('Dev database clear error:', error);
    return sendRouteError(res, error, 'Failed to clear development database');
  }
});

router.put('/auth/profile', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const { name, isPremium } = req.body;
    if (typeof name === 'string') {
      user.name = name.trim();
    }
    if (!isDoctorAccount(user) && typeof isPremium === 'boolean') {
      user.isPremium = isPremium;
    }

    const profileInput = isDoctorAccount(user)
      ? resolveDoctorProfileUpdatePayload(req.body)
      : req.body?.profile && typeof req.body.profile === 'object'
        ? req.body.profile
        : req.body || {};

    if (isDoctorAccount(user)) {
      user.profile = {
        ...defaultDoctorProfile(),
        ...(user.profile || {}),
        ...(profileInput ? sanitizeDoctorProfilePayload(profileInput) : {}),
      };
      const doctorTitle =
        toOptionalString(req.body?.title) || user.title || 'Doctor';
      const doctorSpecialty =
        toOptionalString(req.body?.specialty) ||
        user.specialty ||
        'General Medicine';
      user.title = doctorTitle;
      user.specialty = doctorSpecialty;
      user.bio = toOptionalString(req.body?.bio) || user.bio || '';
      if (typeof req.body?.avatar === 'string') {
        user.avatar = resolveDoctorAvatarValue({
          avatar: req.body.avatar,
          name: user.name || doctorTitle,
          fallbackAvatar: user.avatar,
        });
      }
      if (typeof req.body?.isSpecialist === 'boolean') {
        user.isSpecialist = req.body.isSpecialist;
      } else if (
        typeof req.body?.title === 'string' ||
        typeof req.body?.specialty === 'string'
      ) {
        user.isSpecialist = inferDoctorIsSpecialist({
          title: doctorTitle,
          specialty: doctorSpecialty,
        });
      }
      if (Array.isArray(req.body?.languages)) {
        user.languages = normalizeDoctorLanguageList(
          req.body.languages,
          user.onboarding?.language,
        );
      }
      if (Array.isArray(req.body?.consultationModes)) {
        user.consultationModes = normalizeDoctorConsultationModes(
          req.body.consultationModes,
          user.consultationModes,
        );
      }

      const yearsExperience = Number(req.body?.yearsExperience);
      if (Number.isFinite(yearsExperience) && yearsExperience >= 0) {
        user.yearsExperience = yearsExperience;
      }

      if (typeof req.body?.responseTime === 'string') {
        user.responseTime = req.body.responseTime.trim();
      }
      if (typeof req.body?.nextAvailable === 'string') {
        user.nextAvailable = req.body.nextAvailable.trim();
      }
      if (typeof req.body?.status === 'string') {
        user.status = normalizeDoctorStatus(req.body.status, user.status);
      }
      if (typeof req.body?.priceLabel === 'string') {
        user.priceLabel = req.body.priceLabel.trim();
      }
    } else {
      user.profile = {
        ...defaultUserProfile(),
        ...(user.profile || {}),
        ...sanitizeProfilePayload(profileInput),
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update profile' });
  }
});

router.post('/doctor/avatar-upload', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (!isDoctorAccount(user)) {
      return res.status(403).json({
        success: false,
        message: 'Only doctor accounts can upload profile images.',
      });
    }

    const imageDataUrl = toOptionalString(req.body?.imageDataUrl);
    if (!imageDataUrl) {
      return res.status(400).json({
        success: false,
        message: 'Profile image is required for upload.',
      });
    }

    const previousAvatarFileName = extractBackblazeFileNameFromUrl(user.avatar);
    const upload = await uploadDoctorAvatarToBackblaze({
      imageDataUrl,
    });
    const nextAvatar = resolveDoctorAvatarValue({
      avatar: upload.url,
      name: user.name || user.title || 'Doctor',
      fallbackAvatar: user.avatar,
    });

    user.avatar = nextAvatar;
    await user.save();
    const safeUser = getSafeUser(user);

    if (previousAvatarFileName && previousAvatarFileName !== upload.fileName) {
      try {
        await deleteBackblazeFileByName(previousAvatarFileName);
      } catch (cleanupError) {
        console.error('Previous doctor avatar cleanup error:', cleanupError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor image uploaded',
      avatar: safeUser.avatar,
      fileName: upload.fileName,
      fileId: upload.fileId,
      user: safeUser,
    });
  } catch (error) {
    console.error('Doctor avatar upload error:', error);
    return sendRouteError(res, error, 'Failed to upload doctor profile image');
  }
});

router.get('/doctor/avatar-file', async (req, res) => {
  try {
    const config = getBackblazeConfig();
    const fileName = String(req.query?.file || '')
      .trim()
      .replace(/^\/+/, '');

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Avatar file path is required.',
      });
    }

    const allowedPrefix = String(config.filePrefix || '')
      .trim()
      .replace(/^\/+|\/+$/g, '');

    if (
      !allowedPrefix ||
      fileName.includes('..') ||
      !fileName.startsWith(`${allowedPrefix}/`)
    ) {
      return res.status(404).json({
        success: false,
        message: 'Avatar file not found.',
      });
    }

    const asset = await downloadBackblazeFileByName(fileName);
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Cache-Control', asset.cacheControl);
    return res.status(200).send(asset.buffer);
  } catch (error) {
    console.error('Doctor avatar proxy error:', error);
    return res.status(404).json({
      success: false,
      message: 'Avatar file not found.',
    });
  }
});

router.post('/auth/onboarding', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (isDoctorAccount(user)) {
      const nextLanguage = normalizeLanguage(req.body?.language);
      const nextTitle =
        toOptionalString(req.body?.title) || user.title || 'Doctor';
      const nextSpecialty =
        toOptionalString(req.body?.specialty) ||
        user.specialty ||
        'General Medicine';
      const nextProfileInput = resolveDoctorProfileUpdatePayload(req.body);

      if (typeof req.body?.name === 'string' && req.body.name.trim()) {
        user.name = req.body.name.trim();
      }

      user.title = nextTitle;
      user.specialty = nextSpecialty;
      user.bio = toOptionalString(req.body?.bio) || user.bio || '';
      if (typeof req.body?.avatar === 'string') {
        user.avatar = resolveDoctorAvatarValue({
          avatar: req.body.avatar,
          name: user.name || nextTitle,
          fallbackAvatar: user.avatar,
        });
      } else if (!toOptionalString(user.avatar)) {
        user.avatar = buildNameAvatarDataUrl(
          user.name || nextTitle || 'Doctor',
        );
      }
      if (typeof req.body?.isSpecialist === 'boolean') {
        user.isSpecialist = req.body.isSpecialist;
      } else {
        user.isSpecialist = inferDoctorIsSpecialist({
          title: nextTitle,
          specialty: nextSpecialty,
        });
      }

      const nextYearsExperience = Number(req.body?.yearsExperience);
      user.yearsExperience =
        Number.isFinite(nextYearsExperience) && nextYearsExperience >= 0
          ? nextYearsExperience
          : Number(user.yearsExperience || 0);
      user.responseTime =
        toOptionalString(req.body?.responseTime) ||
        user.responseTime ||
        'Usually responds within 30 minutes';
      user.nextAvailable =
        toOptionalString(req.body?.nextAvailable) ||
        user.nextAvailable ||
        'Today';
      user.priceLabel =
        toOptionalString(req.body?.priceLabel) ||
        user.priceLabel ||
        'By consultation';
      user.status = normalizeDoctorStatus(req.body?.status, user.status);
      user.languages = normalizeDoctorLanguageList(
        req.body?.languages,
        nextLanguage,
      );
      user.consultationModes = normalizeDoctorConsultationModes(
        req.body?.consultationModes,
        user.consultationModes?.length
          ? user.consultationModes
          : ['doctor_chat', 'video'],
      );
      user.profile = {
        ...defaultDoctorProfile(),
        ...(user.profile || {}),
        ...(nextProfileInput
          ? sanitizeDoctorProfilePayload(nextProfileInput)
          : {}),
      };

      user.onboarding = {
        ...(user.onboarding || {}),
        language: nextLanguage,
        onboardingCompleted: true,
        completedAt: new Date().toISOString(),
      };
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Doctor onboarding saved',
        onboarding: user.onboarding,
        user: getSafeUser(user),
      });
    }

    const {
      language = 'en',
      gender = '',
      age = '',
      mainHealthCategory = 'general',
      subHealthCategory = '',
      womensStage = 'general',
      pregnancyWeeks = '',
      isFirstPregnancy = true,
      conditions = '',
      onboardingCompleted = true,
      onboardingSkipped = false,
    } = req.body || {};

    user.onboarding = {
      ...(user.onboarding || {}),
      language: normalizeLanguage(language),
      gender,
      age,
      mainHealthCategory,
      subHealthCategory,
      womensStage,
      pregnancyWeeks,
      isFirstPregnancy,
      conditions,
      onboardingCompleted,
      onboardingSkipped: Boolean(onboardingSkipped),
      completedAt: onboardingCompleted
        ? new Date().toISOString()
        : user.onboarding?.completedAt,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Onboarding saved',
      onboarding: user.onboarding,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to save onboarding' });
  }
});

router.patch('/auth/language', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const nextLanguage = normalizeLanguage(req.body?.language);
    user.onboarding = {
      ...(user.onboarding || {}),
      language: nextLanguage,
    };
    if (isDoctorAccount(user)) {
      user.languages = normalizeDoctorLanguageList(
        [
          nextLanguage,
          ...(Array.isArray(user.languages) ? user.languages : []).filter(
            (value) => normalizeLanguage(value) !== nextLanguage,
          ),
        ],
        nextLanguage,
      );
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Language updated',
      language: nextLanguage,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error('Language update error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update language' });
  }
});

router.get('/home/dashboard', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: buildDashboard(user) });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load dashboard' });
  }
});

router.get('/doctors', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const kind = String(req.query.kind || 'all')
      .trim()
      .toLowerCase();
    const specialtyQuery = String(req.query.specialty || '')
      .trim()
      .toLowerCase();

    const doctors = await ensureDoctorsSeeded();
    const filteredDoctors = doctors.filter((doctor) => {
      if (!isDoctorProfileVisibleToPatients(doctor)) {
        return false;
      }

      if (kind === 'general' && doctor.isSpecialist) {
        return false;
      }

      if (kind === 'specialist' && !doctor.isSpecialist) {
        return false;
      }

      if (
        specialtyQuery &&
        !(doctor.specialty || '').toLowerCase().includes(specialtyQuery)
      ) {
        return false;
      }

      return true;
    });

    return res.status(200).json({
      success: true,
      doctors: filteredDoctors.map(getSafeDoctor),
    });
  } catch (error) {
    console.error('Doctors list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load doctors',
    });
  }
});

router.get('/doctor-chats', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const chats = await scanModelByField(
      DoctorChat,
      isDoctorAccount(user) ? 'doctorId' : 'patientId',
      user.id,
    );

    const payload = (await buildDoctorChatPayloads(chats, user)).sort(
      (left, right) =>
        String(right.lastMessageAt || '').localeCompare(
          String(left.lastMessageAt || ''),
        ),
    );

    return res.status(200).json({ success: true, chats: payload });
  } catch (error) {
    console.error('Doctor chats list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load doctor chats',
    });
  }
});

router.get('/doctor-chats/stream', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: ready\ndata: {"success":true}\n\n`);

    const unregister = registerDoctorChatStreamClient(user, res);
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (_error) {
        // Closed connection handled below.
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unregister();
    });
  } catch (error) {
    console.error('Doctor chats stream error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to open doctor chats stream',
    });
  }
});

router.post('/doctor-chats', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (isDoctorAccount(user)) {
      return res.status(403).json({
        success: false,
        message: 'Only patients can start a doctor chat',
      });
    }

    const doctorId = String(req.body?.doctorId || '').trim();
    const subject = String(req.body?.subject || 'Doctor consultation')
      .trim()
      .slice(0, 120);
    const initialMessage = String(req.body?.initialMessage || '').trim();

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'doctorId is required',
      });
    }

    const doctor = await findDoctorById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    if (!isDoctorProfileVisibleToPatients(doctor)) {
      return res.status(403).json({
        success: false,
        message: 'Doctor profile is not available to patients yet.',
      });
    }

    let chat = await findDoctorChatByParticipants(user.id, doctor.id);

    if (!chat) {
      const messages = [
        buildDoctorGreeting(doctor, user.onboarding?.language || 'en'),
      ];
      messages[0] = {
        ...messages[0],
        readBy: ['doctor', 'patient'],
      };
      if (initialMessage) {
        messages.push(buildChatMessage('patient', user, initialMessage));
      }

      chat = new DoctorChat({
        id: uuidv4(),
        patientId: user.id,
        doctorId: doctor.id,
        subject,
        status: 'active',
        messages,
        lastMessageAt:
          messages[messages.length - 1]?.createdAt || new Date().toISOString(),
      });
    } else if (initialMessage) {
      await markDoctorChatMessagesSeen(chat, user, { persist: false });
      const nextMessage = buildChatMessage('patient', user, initialMessage);
      chat.messages = [...(chat.messages || []), nextMessage];
      chat.lastMessageAt = nextMessage.createdAt;
      clearDoctorChatTypingStateForSender(chat, 'patient');
    }

    await chat.save();
    await broadcastDoctorChatEvent(chat);

    const patient = await findPatientById(chat.patientId);

    return res.status(201).json({
      success: true,
      chat: buildDoctorChatPayload(chat, doctor, patient, user),
    });
  } catch (error) {
    console.error('Doctor chat create error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start doctor chat',
    });
  }
});

router.get('/doctor-chats/:chatId', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const chat = await DoctorChat.get(req.params.chatId);
    if (!chat || !canAccessDoctorChat(user, chat)) {
      return res.status(404).json({
        success: false,
        message: 'Doctor chat not found',
      });
    }

    await markDoctorChatMessagesSeen(chat, user);

    const [doctor, patient] = await Promise.all([
      findDoctorById(chat.doctorId),
      findPatientById(chat.patientId),
    ]);

    return res.status(200).json({
      success: true,
      chat: buildDoctorChatPayload(chat, doctor, patient, user),
    });
  } catch (error) {
    console.error('Doctor chat load error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load doctor chat',
    });
  }
});

router.post('/doctor-chats/:chatId/typing', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const chat = await DoctorChat.get(req.params.chatId);
    if (!chat || !canAccessDoctorChat(user, chat)) {
      return res.status(404).json({
        success: false,
        message: 'Doctor chat not found',
      });
    }

    await updateDoctorChatTypingState(chat, user, req.body?.isTyping);
    await broadcastDoctorChatEvent(chat);

    const [doctor, patient] = await Promise.all([
      findDoctorById(chat.doctorId),
      findPatientById(chat.patientId),
    ]);

    return res.status(200).json({
      success: true,
      chat: buildDoctorChatPayload(chat, doctor, patient, user),
    });
  } catch (error) {
    console.error('Doctor chat typing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update doctor chat typing status',
    });
  }
});

router.post(
  '/doctor-chats/:chatId/messages',
  authRequired,
  async (req, res) => {
    try {
      const user = await getAuthedUser(req);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const chat = await DoctorChat.get(req.params.chatId);
      if (!chat || !canAccessDoctorChat(user, chat)) {
        return res.status(404).json({
          success: false,
          message: 'Doctor chat not found',
        });
      }

      const message = String(req.body?.message || '').trim();
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'message is required',
        });
      }

      await markDoctorChatMessagesSeen(chat, user);

      const nextMessage = buildChatMessage(
        isDoctorAccount(user) ? 'doctor' : 'patient',
        user,
        message,
      );
      chat.messages = [...(chat.messages || []), nextMessage];
      chat.lastMessageAt = nextMessage.createdAt;
      clearDoctorChatTypingStateForSender(
        chat,
        isDoctorAccount(user) ? 'doctor' : 'patient',
      );
      await chat.save();
      const { doctor, patient } = await resolveDoctorChatPartiesForUser(
        chat,
        user,
      );

      const responsePayload = {
        success: true,
        chat: buildDoctorChatPayload(chat, doctor, patient, user),
        message: nextMessage,
      };

      res.status(201).json(responsePayload);

      void broadcastDoctorChatEvent(chat).catch((broadcastError) => {
        console.error('Doctor chat broadcast error:', broadcastError);
      });
      return;
    } catch (error) {
      console.error('Doctor chat message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send doctor chat message',
      });
    }
  },
);

router.get('/appointments', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const all = user.appointments || [];
    return res.status(200).json({
      success: true,
      upcoming: all.filter((item) => !item.isPast),
      past: all.filter((item) => item.isPast),
    });
  } catch (error) {
    console.error('Appointments list error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load appointments' });
  }
});

router.post('/appointments', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const {
      day,
      weekday,
      time,
      doctor,
      type,
      reason,
      status = 'Scheduled',
      statusColor = '#2563eb',
      scheduledAt,
    } = req.body || {};

    if (!time || !doctor || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'time, doctor, type and reason are required',
      });
    }

    const appointment = {
      id: uuidv4(),
      day: day || '',
      weekday: weekday || '',
      time,
      doctor,
      type,
      reason,
      status,
      statusColor,
      isPast: false,
      scheduledAt: scheduledAt || new Date().toISOString(),
    };

    user.appointments = [appointment, ...(user.appointments || [])];
    await user.save();

    return res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create appointment' });
  }
});

router.patch('/appointments/:appointmentId', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const { appointmentId } = req.params;
    const index = (user.appointments || []).findIndex(
      (item) => item.id === appointmentId,
    );

    if (index === -1) {
      return res
        .status(404)
        .json({ success: false, message: 'Appointment not found' });
    }

    const next = {
      ...user.appointments[index],
      ...req.body,
    };

    user.appointments[index] = next;
    await user.save();

    return res.status(200).json({ success: true, appointment: next });
  } catch (error) {
    console.error('Update appointment error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update appointment' });
  }
});

router.get('/notifications', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      notifications: user.notifications || [],
      unreadCount: (user.notifications || []).filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load notifications' });
  }
});

router.post('/notifications', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const payload = req.body || {};
    if (!payload.title || !payload.description) {
      return res.status(400).json({
        success: false,
        message: 'title and description are required',
      });
    }

    const notification = {
      id: uuidv4(),
      category: payload.category || 'system',
      title: payload.title,
      description: payload.description,
      timestamp:
        payload.timestamp ||
        `Today • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      icon: payload.icon || 'notifications-outline',
      color: payload.color || '#64748b',
      actionLabel: payload.actionLabel || null,
      createdAt: new Date().toISOString(),
    };

    user.notifications = [notification, ...(user.notifications || [])];
    await user.save();

    return res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create notification' });
  }
});

router.patch(
  '/notifications/:notificationId/read',
  authRequired,
  async (req, res) => {
    try {
      const user = await getAuthedUser(req);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const { notificationId } = req.params;
      const index = (user.notifications || []).findIndex(
        (item) => item.id === notificationId,
      );

      if (index === -1) {
        return res
          .status(404)
          .json({ success: false, message: 'Notification not found' });
      }

      user.notifications[index] = {
        ...user.notifications[index],
        read: true,
      };

      await user.save();

      return res
        .status(200)
        .json({ success: true, notification: user.notifications[index] });
    } catch (error) {
      console.error('Mark notification error:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Failed to update notification' });
    }
  },
);

router.post('/notifications/mark-all-read', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    user.notifications = (user.notifications || []).map((item) => ({
      ...item,
      read: true,
    }));
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update notifications' });
  }
});

router.get('/notification-settings', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      settings: user.notificationSettings || defaultNotificationSettings(),
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load notification settings',
    });
  }
});

router.put('/notification-settings', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const current = user.notificationSettings || defaultNotificationSettings();
    user.notificationSettings = {
      ...current,
      ...req.body,
    };

    await user.save();

    return res
      .status(200)
      .json({ success: true, settings: user.notificationSettings });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
    });
  }
});

router.get('/reports', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: buildReports(user) });
  } catch (error) {
    console.error('Reports error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load reports' });
  }
});

router.get('/search', authRequired, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q) {
      return res.status(200).json({ success: true, results: [] });
    }

    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const appointments = (user.appointments || [])
      .filter((item) =>
        `${item.reason} ${item.doctor} ${item.type}`.toLowerCase().includes(q),
      )
      .map((item) => ({ type: 'appointment', item }));

    const notifications = (user.notifications || [])
      .filter((item) =>
        `${item.title} ${item.description}`.toLowerCase().includes(q),
      )
      .map((item) => ({ type: 'notification', item }));

    return res
      .status(200)
      .json({ success: true, results: [...appointments, ...notifications] });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
});

async function issueLiveKitConsultationToken(req, res) {
  try {
    const liveKit = getLiveKitConfig();
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (
      (!liveKit.url && !liveKit.publicUrl) ||
      !liveKit.apiKey ||
      !liveKit.apiSecret
    ) {
      return res.status(503).json({
        success: false,
        message:
          'LiveKit is not configured on backend. Set LIVEKIT_URL (or LIVEKIT_PUBLIC_URL), LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.',
      });
    }

    const liveKitUrl = normalizeLiveKitUrl(
      liveKit.publicUrl || liveKit.url,
      req,
    );
    if (!liveKitUrl.ok) {
      return res.status(503).json({
        success: false,
        message: liveKitUrl.message,
      });
    }

    const requestedRoom = normalizeRoomName(req.body?.roomName || '');
    const roomName =
      requestedRoom || `oga-${Math.random().toString(36).slice(2, 10)}`;

    const identityBase = normalizeRoomName(
      user.id || req.auth?.userId || req.auth?.email || 'guest',
    );
    const identity = `${identityBase || 'guest'}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const participantName = String(
      req.body?.participantName || user.name || 'OgaDoctor User',
    )
      .toString()
      .trim()
      .slice(0, 80);

    const token = new AccessToken(liveKit.apiKey, liveKit.apiSecret, {
      identity,
      name: participantName,
      ttl: liveKit.tokenTtl,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwtToken = await token.toJwt();

    return res.status(200).json({
      success: true,
      provider: 'livekit',
      roomName,
      serverUrl: liveKitUrl.url,
      token: jwtToken,
      identity,
      participantName,
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    return sendRouteError(
      res,
      error,
      'Failed to generate consultation access token',
    );
  }
}

router.post(
  '/consultation/livekit/token',
  authRequired,
  issueLiveKitConsultationToken,
);

router.get(
  '/consultation/transcripts/:roomName',
  authRequired,
  async (req, res) => {
    try {
      const roomName = normalizeRoomName(req.params?.roomName || '');
      if (!roomName) {
        return res.status(400).json({
          success: false,
          message: 'Valid room name is required',
        });
      }

      const transcript = await findConsultationTranscriptByRoom(roomName);
      return res.status(200).json({
        success: true,
        transcript: transcript
          ? buildConsultationTranscriptPayload(transcript)
          : null,
      });
    } catch (error) {
      console.error('Consultation transcript fetch error:', error);
      return sendRouteError(
        res,
        error,
        'Failed to load consultation transcript',
      );
    }
  },
);

router.post('/consultation/transcripts', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const roomName = normalizeRoomName(req.body?.roomName || '');
    if (!roomName) {
      return res.status(400).json({
        success: false,
        message: 'Valid room name is required',
      });
    }

    const incomingParticipants = Array.isArray(req.body?.participants)
      ? req.body.participants
      : [];
    const incomingEntries = Array.isArray(req.body?.entries)
      ? req.body.entries
      : [];

    let transcript = await findConsultationTranscriptByRoom(roomName);
    if (!transcript) {
      transcript = new ConsultationTranscript({
        id: uuidv4(),
        roomName,
        consultationType: normalizeConsultationType(req.body?.consultationType),
        status: 'active',
        createdByUserId: user.id,
        users: [],
        participants: [],
        entries: [],
      });
    }

    const selfParticipant = buildTranscriptParticipantFromUser(
      user,
      req.body?.identity,
      req.body?.participantName || user.name,
    );

    transcript.consultationType =
      normalizeConsultationType(req.body?.consultationType) ||
      transcript.consultationType ||
      'video';
    transcript.status = normalizeTranscriptStatus(
      req.body?.status || transcript.status,
    );
    transcript.startedAt =
      transcript.startedAt ||
      normalizeIsoTimestamp(
        req.body?.startedAt ||
          incomingEntries[0]?.at ||
          new Date().toISOString(),
      );
    transcript.endedAt =
      transcript.status === 'completed'
        ? normalizeIsoTimestamp(req.body?.endedAt || new Date().toISOString())
        : transcript.endedAt || null;
    transcript.lastSavedByUserId = user.id;
    transcript.users = mergeTranscriptUsers(transcript.users, user);
    transcript.participants = mergeTranscriptParticipants(
      transcript.participants,
      [...incomingParticipants, selfParticipant].filter(Boolean),
    );
    transcript.entries = mergeTranscriptEntries(
      transcript.entries,
      incomingEntries,
    );
    transcript.summary = buildTranscriptSummary(transcript.entries);

    await transcript.save();

    return res.status(200).json({
      success: true,
      message: 'Consultation transcript saved',
      transcript: buildConsultationTranscriptPayload(transcript),
    });
  } catch (error) {
    console.error('Consultation transcript save error:', error);
    return sendRouteError(res, error, 'Failed to save consultation transcript');
  }
});

router.post('/ai/health-chat', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          'Gemini API key is missing/invalid. Set GEMINI_API_KEY with an AIza key.',
      });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (messages.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'messages array is required' });
    }

    const conversation = messages
      .slice(-24)
      .filter(
        (msg) => msg && typeof msg.content === 'string' && msg.content.trim(),
      )
      .map((msg) => ({
        role: toGeminiRole(msg.role),
        parts: [{ text: msg.content.trim() }],
      }));

    if (conversation.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'messages must include at least one non-empty message',
      });
    }

    const systemPrompt = buildHealthSystemPrompt(user.onboarding?.language);
    const modelCandidates = [
      ...new Set(
        [
          GEMINI_MODEL,
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-flash-latest',
          'gemini-2.0-flash-lite',
        ]
          .map(normalizeGeminiModelName)
          .filter(Boolean),
      ),
    ];
    let lastProviderStatus = 502;
    let lastProviderMessage = 'Gemini request failed';
    let lastProviderDetail = null;

    for (const rawModelName of modelCandidates) {
      const modelName = normalizeGeminiModelName(rawModelName);
      if (!modelName) {
        continue;
      }
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          modelName,
        )}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: conversation,
            generationConfig: {
              temperature: 0.4,
            },
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const providerMessage = parseGeminiError(data);
        lastProviderStatus = response.status || 502;
        lastProviderMessage =
          providerMessage || `Gemini request failed for model ${modelName}`;
        lastProviderDetail = data;
        console.error('Gemini health chat provider error:', {
          modelName,
          status: response.status,
          providerMessage: lastProviderMessage,
        });
        continue;
      }

      const reply = (data?.candidates || [])
        .flatMap((candidate) => candidate?.content?.parts || [])
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .join('\n')
        .trim();

      if (reply) {
        return res.status(200).json({ success: true, reply });
      }

      lastProviderStatus = 502;
      lastProviderMessage = `Gemini returned an empty response for model ${modelName}`;
      lastProviderDetail = data;
    }

    return res
      .status(
        lastProviderStatus >= 400 && lastProviderStatus < 600
          ? lastProviderStatus
          : 502,
      )
      .json({
        success: false,
        message: `Gemini request failed: ${lastProviderMessage}`,
        detail: lastProviderDetail,
      });
  } catch (error) {
    console.error('AI health chat error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to generate AI response' });
  }
});

export default router;
