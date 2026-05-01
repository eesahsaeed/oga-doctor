const TOKEN_KEY = 'ogadoctor_token';
const USER_KEY = 'ogadoctor_user';
const REMEMBERED_USER_KEY = 'ogadoctor_remembered_user';
const FORM_DRAFT_PREFIX = 'ogadoctor_form_draft_';

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

export function getRememberedUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(REMEMBERED_USER_KEY);
  if (!raw) return null;
  return safeParse(raw);
}

export function saveRememberedUser(user = {}) {
  if (typeof window === 'undefined') return;
  const existing = getRememberedUser() || {};
  const next = {
    ...existing,
    ...(user || {}),
  };

  const sanitized = {
    name: next.name || '',
    email: next.email || '',
  };

  window.localStorage.setItem(REMEMBERED_USER_KEY, JSON.stringify(sanitized));
}

function getDraftKey(formId) {
  return `${FORM_DRAFT_PREFIX}${formId}`;
}

export function getStoredFormDraft(formId, fallback = {}) {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(getDraftKey(formId));
  if (!raw) return fallback;
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object') return fallback;
  return parsed;
}

export function saveStoredFormDraft(formId, payload = {}) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getDraftKey(formId), JSON.stringify(payload));
}

export function clearStoredFormDraft(formId) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getDraftKey(formId));
}

export function isOnboardingDone(user) {
  return Boolean(user?.onboarding?.onboardingCompleted);
}
