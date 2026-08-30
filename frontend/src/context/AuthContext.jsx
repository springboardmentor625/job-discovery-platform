import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser } from '../api/authApi';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('swipex_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const data = await fetchCurrentUser(token);
        setUser(data);
      } catch {
        localStorage.removeItem('swipex_token');
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);
  const value = useMemo(() => ({
    token,
    user,
    loading,
    login: (nextToken) => {
      localStorage.setItem('swipex_token', nextToken);
      setToken(nextToken);
    },
    logout: () => {
      localStorage.removeItem('swipex_token');
      setToken('');
      setUser(null);
    },
    refreshUser: async () => {
      if (token) {
        try {
          const data = await fetchCurrentUser(token);
          setUser(data);
        } catch (err) {
          console.error("Failed to refresh user:", err);
        }
      }
    }
  }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}