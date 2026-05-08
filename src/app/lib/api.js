import { getStoredToken } from './session';
import { getStoredLanguage } from './i18n';

function normalizeApiBase(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '/api';

  const withoutTrailingSlash = value.replace(/\/+$/, '');
  // If only origin is provided, default to backend API prefix.
  if (/^https?:\/\/[^/]+$/i.test(withoutTrailingSlash)) {
    return `${withoutTrailingSlash}/api`;
  }

  return withoutTrailingSlash;
}

function extractValidationMessage(payload) {
  if (!Array.isArray(payload?.errors) || payload.errors.length === 0) {
    return '';
  }

  const firstError = payload.errors.find(
    (entry) => typeof entry?.msg === 'string' && entry.msg.trim(),
  );

  return firstError?.msg?.trim() || '';
}

function extractErrorMessage(payload, status) {
  if (typeof payload === 'string') {
    const message = payload.trim();
    return message || `Request failed (${status})`;
  }

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }

    const validationMessage = extractValidationMessage(payload);
    if (validationMessage) {
      return validationMessage;
    }

    const detailMessage = payload?.detail?.error?.message;
    if (typeof detailMessage === 'string' && detailMessage.trim()) {
      return detailMessage.trim();
    }
  }

  return `Request failed (${status})`;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

async function request(
  path,
  { method = 'GET', body, headers = {}, signal } = {},
) {
  const token = getStoredToken();
  const language = getStoredLanguage();

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  requestHeaders['x-language'] = language || 'en';

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload, response.status));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const apiClient = {
  doctors: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        search.set(key, String(value).trim());
      }
    });
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/doctors${suffix}`);
  },
  doctorChats: () => request('/doctor-chats'),
  createDoctorChat: (payload) =>
    request('/doctor-chats', { method: 'POST', body: payload }),
  doctorChat: (chatId) => request(`/doctor-chats/${chatId}`),
  sendDoctorChatMessage: (chatId, payload) =>
    request(`/doctor-chats/${chatId}/messages`, {
      method: 'POST',
      body: payload,
    }),
  signUp: (payload) =>
    request('/auth/signup', { method: 'POST', body: payload }),
  signIn: (payload) =>
    request('/auth/signin', { method: 'POST', body: payload }),
  forgotPassword: (payload) =>
    request('/auth/forgot-password', { method: 'POST', body: payload }),
  validateResetPasswordToken: (token, language) => {
    const search = new URLSearchParams({ token: String(token || '') });
    if (language) {
      search.set('language', String(language).trim());
    }
    return request(`/auth/reset-password/validate?${search.toString()}`);
  },
  resetPassword: (payload) =>
    request('/auth/reset-password', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  updateProfile: (payload) =>
    request('/auth/profile', { method: 'PUT', body: payload }),
  updateLanguage: (payload) =>
    request('/auth/language', { method: 'PATCH', body: payload }),
  saveOnboarding: (payload) =>
    request('/auth/onboarding', { method: 'POST', body: payload }),
  dashboard: () => request('/home/dashboard'),
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  appointments: () => request('/appointments'),
  createAppointment: (payload) =>
    request('/appointments', { method: 'POST', body: payload }),
  updateAppointment: (appointmentId, payload) =>
    request(`/appointments/${appointmentId}`, {
      method: 'PATCH',
      body: payload,
    }),

  notifications: () => request('/notifications'),
  createNotification: (payload) =>
    request('/notifications', { method: 'POST', body: payload }),
  markNotificationRead: (notificationId) =>
    request(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/notifications/mark-all-read', { method: 'POST' }),

  getNotificationSettings: () => request('/notification-settings'),
  updateNotificationSettings: (payload) =>
    request('/notification-settings', { method: 'PUT', body: payload }),

  reports: () => request('/reports'),
  createConsultationToken: (payload) =>
    request('/consultation/livekit/token', { method: 'POST', body: payload }),
  consultationTranscript: (roomName) =>
    request(`/consultation/transcripts/${encodeURIComponent(roomName)}`),
  saveConsultationTranscript: (payload) =>
    request('/consultation/transcripts', { method: 'POST', body: payload }),
  healthChat: (messages, options = {}) =>
    request('/ai/health-chat', {
      method: 'POST',
      body: { messages },
      signal: options.signal,
    }),
};
