import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, type User } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Safely decode a JWT payload without throwing */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // On mount (or when token changes from an external source), restore user from the stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    // Check token is not obviously expired before hitting the network
    const payload = decodeJwtPayload(storedToken);
    if (payload?.exp && Date.now() / 1000 > payload.exp) {
      logout();
      setIsLoading(false);
      return;
    }

    const restoreUser = async () => {
      try {
        // Ensure token is in localStorage before the request fires
        localStorage.setItem('token', storedToken);
        const userData = await authApi.getCurrentUser();
        // Prefer the role from the JWT payload (avoids another round-trip issue)
        const role = payload?.role ?? userData.role;
        setToken(storedToken);
        setUser({ ...userData, role });
      } catch (err) {
        // /me failed (token invalid/expired) — silently clear, don't force-redirect
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    restoreUser();
    // Only run once on mount — not on every token state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Called immediately after a successful login/register */
  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
