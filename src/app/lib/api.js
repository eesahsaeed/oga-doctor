import { getStoredToken } from './session';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(
  /\/$/,
  '',
);

async function request(
  path,
  { method = 'GET', body, headers = {}, signal } = {},
) {
  const token = getStoredToken();

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

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
    const error = new Error(
      payload?.message ||
        payload?.error ||
        (typeof payload === 'string' && payload) ||
        `Request failed (${response.status})`,
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const apiClient = {
  signUp: (payload) =>
    request('/auth/signup', { method: 'POST', body: payload }),
  signIn: (payload) =>
    request('/auth/signin', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  updateProfile: (payload) =>
    request('/auth/profile', { method: 'PUT', body: payload }),
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
  healthChat: (messages, options = {}) =>
    request('/ai/health-chat', {
      method: 'POST',
      body: { messages },
      signal: options.signal,
    }),
};
