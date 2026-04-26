import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/api';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  saveSession,
} from '../lib/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    let active = true;

    async function hydrateUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const payload = await apiClient.me();
        if (active && payload?.success && payload.user) {
          setUser(payload.user);
          saveSession({ token, user: payload.user });
        }
      } catch (_error) {
        if (active) {
          clearSession();
          setToken('');
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      active = false;
    };
  }, [token]);

  const signIn = async (credentials) => {
    const payload = await apiClient.signIn(credentials);
    if (payload?.success) {
      setToken(payload.token);
      setUser(payload.user);
      saveSession({ token: payload.token, user: payload.user });
    }
    return payload;
  };

  const signUp = async (payload) => {
    const response = await apiClient.signUp(payload);
    if (response?.success) {
      setToken(response.token);
      setUser(response.user);
      saveSession({ token: response.token, user: response.user });
    }
    return response;
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const payload = await apiClient.me();
    if (payload?.success && payload.user) {
      setUser(payload.user);
      saveSession({ token, user: payload.user });
      return payload.user;
    }
    return null;
  };

  const signOut = () => {
    clearSession();
    setToken('');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      refreshProfile,
      setUser,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
