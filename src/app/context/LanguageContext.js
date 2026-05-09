import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../lib/api';
import { getStoredUser, saveSession } from '../lib/session';
import {
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  getLanguageMeta,
  getStoredLanguage,
  normalizeLanguage,
  saveStoredLanguage,
  translateText,
} from '../lib/i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { token, user, setUser } = useAuth();
  const [language, setLanguageState] = useState(() => {
    const rawUserLanguage = user?.onboarding?.language;
    if (rawUserLanguage) {
      return normalizeLanguage(rawUserLanguage);
    }

    const stored = getStoredLanguage();
    if (stored) return stored;

    return detectBrowserLanguage();
  });

  useEffect(() => {
    const rawUserLanguage = user?.onboarding?.language;
    if (!rawUserLanguage) return;

    const nextLanguage = normalizeLanguage(rawUserLanguage);
    if (nextLanguage === language) return;

    setLanguageState(nextLanguage);
    saveStoredLanguage(nextLanguage);
  }, [language, user?.onboarding?.language]);

  const updateLanguage = async (nextLanguageInput) => {
    const nextLanguage = normalizeLanguage(nextLanguageInput);
    const fallbackUser = user || getStoredUser();
    const mergedLocalUser = fallbackUser
      ? {
          ...fallbackUser,
          onboarding: {
            ...(fallbackUser.onboarding || {}),
            language: nextLanguage,
          },
        }
      : null;

    setLanguageState(nextLanguage);
    saveStoredLanguage(nextLanguage);
    if (token && mergedLocalUser) {
      setUser(mergedLocalUser);
      saveSession({ token, user: mergedLocalUser });
    }

    if (!token) {
      return nextLanguage;
    }

    try {
      const payload = await apiClient.updateLanguage({
        language: nextLanguage,
      });
      if (payload?.success && payload.user) {
        setUser(payload.user);
        saveSession({ token, user: payload.user });
      } else if (mergedLocalUser) {
        setUser(mergedLocalUser);
        saveSession({ token, user: mergedLocalUser });
      }
    } catch (_error) {
      // keep local language selection even when backend sync fails
    }

    return nextLanguage;
  };

  const value = useMemo(() => {
    const meta = getLanguageMeta(language);
    return {
      language: meta.code,
      locale: meta.locale,
      languageMeta: meta,
      languages: SUPPORTED_LANGUAGES,
      setLanguage: updateLanguage,
      tr: (text, params) => translateText(meta.code, text, params),
      formatDate: (value, options = {}) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat(meta.locale, options).format(date);
      },
      formatDateTime: (value, options = {}) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat(meta.locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
          ...options,
        }).format(date);
      },
      formatTime: (value, options = {}) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat(meta.locale, {
          hour: 'numeric',
          minute: '2-digit',
          ...options,
        }).format(date);
      },
    };
  }, [language, token, user]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
