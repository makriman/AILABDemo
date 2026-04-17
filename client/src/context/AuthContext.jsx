import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function hydrateUser() {
      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await api.getMe();
        if (mounted) {
          setUser(me);
        }
      } catch (error) {
        localStorage.removeItem('token');
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      mounted = false;
    };
  }, [token]);

  const authApi = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      async signup(payload) {
        const result = await api.signup(payload);
        localStorage.setItem('token', result.token);
        setToken(result.token);
        setUser({ userId: result.userId, username: result.username });
        return result;
      },
      async login(payload) {
        const result = await api.login(payload);
        localStorage.setItem('token', result.token);
        setToken(result.token);
        setUser({ userId: result.userId, username: result.username });
        return result;
      },
      logout() {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      },
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={authApi}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider.');
  }

  return context;
}
