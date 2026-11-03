import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../../shared/api/client';
import { authApi } from './auth.api';

const AuthContext = createContext(null);

/**
 * Session state for the whole app.
 * The session itself is an httpOnly cookie; here we only keep the current user.
 * status: 'loading' (checking the cookie) | 'authenticated' | 'anonymous'
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    const controller = new AbortController();
    authApi
      .me({ signal: controller.signal })
      .then((user) => setState({ status: 'authenticated', user }))
      .catch((error) => error.name !== 'AbortError' && setState({ status: 'anonymous', user: null }));
    return () => controller.abort();
  }, []);

  // Any 401 from the API (expired cookie, deactivated account) signs the user out locally.
  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'anonymous', user: null }));
    return () => setUnauthorizedHandler(() => {});
  }, []);

  const login = useCallback(async (credentials) => {
    const { user } = await authApi.login(credentials);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const { user } = await authApi.register(data);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setState({ status: 'anonymous', user: null });
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, isAdmin: state.user?.role === 'admin', login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
