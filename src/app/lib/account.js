export function normalizeAccountType(value, fallback = 'patient') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (normalized === 'doctor' || normalized === 'patient') {
    return normalized;
  }
  return fallback;
}

export function isDoctorUser(user) {
  return normalizeAccountType(user?.accountType, 'patient') === 'doctor';
}

export function isPatientUser(user) {
  return !isDoctorUser(user);
}

export function isOnboardingCompleteForUser(user) {
  return isDoctorUser(user) || Boolean(user?.onboarding?.onboardingCompleted);
}

export function getAuthRoute(accountType = 'patient', mode = 'signin') {
  const safeAccountType = normalizeAccountType(accountType, 'patient');
  const safeMode = mode === 'signup' ? 'signup' : 'signin';
  return `/auth/${safeAccountType}/${safeMode}`;
}

export function getDefaultAppRoute(user) {
  if (isDoctorUser(user)) {
    return '/app/dashboard';
  }

  return isOnboardingCompleteForUser(user) ? '/app/dashboard' : '/onboarding';
}
