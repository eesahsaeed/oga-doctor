import { getStoredToken } from './session';
import { getStoredLanguage, translateText } from './i18n';

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

  const messages = payload.errors
    .map((entry) => (typeof entry?.msg === 'string' ? entry.msg.trim() : ''))
    .filter(Boolean);

  const unique = [...new Set(messages)];
  if (unique.length === 0) {
    return '';
  }

  return unique.slice(0, 2).join(' ');
}

function getClientLanguage() {
  return getStoredLanguage() || 'en';
}

function translateClientMessage(text) {
  return translateText(getClientLanguage(), text);
}

function buildStatusErrorMessage(status, path = '') {
  const normalizedPath = String(path || '').toLowerCase();

  if (status === 400 || status === 422) {
    if (normalizedPath.includes('/auth/reset-password')) {
      return translateClientMessage(
        'This reset link or password input is not valid. Review the details and try again.',
      );
    }

    return translateClientMessage(
      'Some information is missing or invalid. Review your input and try again.',
    );
  }

  if (status === 401) {
    if (normalizedPath.includes('/auth/signin')) {
      return translateClientMessage(
        'The password you entered is not correct. Check it and try again.',
      );
    }

    return translateClientMessage(
      'Your session is no longer valid. Sign in again and try once more.',
    );
  }

  if (status === 403) {
    return translateClientMessage(
      'You do not have permission to do this action with the current account.',
    );
  }

  if (status === 404) {
    if (normalizedPath.includes('/auth/signin')) {
      return translateClientMessage(
        'We could not find an account with that email. Check the address or create a new account.',
      );
    }

    if (normalizedPath.includes('/auth/forgot-password')) {
      return translateClientMessage(
        'We could not find an account with that email. Check the address and try again.',
      );
    }

    return translateClientMessage(
      'We could not find the requested record. It may have been removed or may not exist yet.',
    );
  }

  if (status === 409) {
    return translateClientMessage(
      'This information already exists or was changed elsewhere. Refresh and try again.',
    );
  }

  if (status === 429) {
    return translateClientMessage(
      'Too many attempts were made just now. Wait a moment and try again.',
    );
  }

  if (status === 503) {
    return translateClientMessage(
      'This service is temporarily unavailable. The backend, database, or a required integration may be down.',
    );
  }

  if (status === 504) {
    return translateClientMessage(
      'The server took too long to respond. Please try again in a moment.',
    );
  }

  if (status >= 500) {
    return translateClientMessage(
      'Something went wrong on the server. Please try again. If it keeps happening, check the backend logs or service configuration.',
    );
  }

  return translateClientMessage(`Request failed (${status})`);
}

function expandServerMessage(message, status, path = '') {
  const normalizedMessage = String(message || '')
    .trim()
    .toLowerCase();
  const normalizedPath = String(path || '').toLowerCase();

  if (normalizedMessage === 'user not found') {
    return buildStatusErrorMessage(status || 404, path);
  }

  if (
    normalizedMessage === 'invalid email or password' &&
    normalizedPath.includes('/auth/signin')
  ) {
    return buildStatusErrorMessage(401, path);
  }

  if (
    normalizedMessage === 'server error. please try again later.' ||
    normalizedMessage === 'not found'
  ) {
    return buildStatusErrorMessage(status, path);
  }

  return message;
}

function extractErrorMessage(payload, status, path = '') {
  const fallback = buildStatusErrorMessage(status, path);

  if (typeof payload === 'string') {
    const message = payload.trim();
    if (!message || /^request failed/i.test(message)) {
      return fallback;
    }
    return message;
  }

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      const message = payload.message.trim();
      if (
        message.toLowerCase() === 'not found' ||
        message.toLowerCase() === 'user not found' ||
        message.toLowerCase() === 'invalid email or password' ||
        message.toLowerCase() === 'server error. please try again later.'
      ) {
        return expandServerMessage(message, status, path);
      }
      if (message.toLowerCase() === 'not found') {
        return fallback;
      }
      return message;
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return expandServerMessage(payload.error.trim(), status, path);
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

  return fallback;
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

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (fetchError) {
    const message =
      fetchError?.name === 'AbortError'
        ? translateClientMessage(
            'This request was cancelled before it finished. Please try again.',
          )
        : translateClientMessage(
            'We could not reach the server. Check your internet connection or backend URL and try again.',
          );
    const error = new Error(message);
    error.cause = fetchError;
    error.status = 0;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      extractErrorMessage(payload, response.status, path),
    );
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
  uploadDoctorAvatar: (payload) =>
    request('/doctor/avatar-upload', { method: 'POST', body: payload }),
  clearDevDatabase: (payload) =>
    request('/admin/dev/clear-database', { method: 'POST', body: payload }),
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
