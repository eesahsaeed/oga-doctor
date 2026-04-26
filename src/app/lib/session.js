const TOKEN_KEY = 'ogadoctor_token';
const USER_KEY = 'ogadoctor_user';

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

export function getStoredToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  return safeParse(raw);
}

export function saveSession({ token, user }) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isOnboardingDone(user) {
  return Boolean(user?.onboarding?.onboardingCompleted);
}
