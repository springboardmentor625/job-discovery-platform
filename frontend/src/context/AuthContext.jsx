import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token from localStorage and fetch user info on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        try {
          const res = await api.get("/me");
          setUser(res.data);
        } catch (err) {
          console.error("Token verification failed on startup:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            delete api.defaults.headers.common["Authorization"];
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (accessToken) => {
    // 1. Immediately store token in localStorage and axios headers
    localStorage.setItem("token", accessToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    setToken(accessToken);

    // 2. Fetch fresh user information with the new token
    try {
      const res = await api.get("/me");
      setUser(res.data);
      return res.data;
    } catch (e) {
      console.error("Failed to load user info after login:", e);
      return null;
    }
  };

  const logout = () => {
    // Completely clear authentication tokens and state
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        setUser,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}