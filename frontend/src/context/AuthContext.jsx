import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    // Completely clear authentication tokens and state across all storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    sessionStorage.clear();

    if (api.defaults.headers.common) {
      delete api.defaults.headers.common["Authorization"];
    }
    if (typeof api.defaults.headers.delete === "function") {
      api.defaults.headers.delete("Authorization");
    }
    delete api.defaults.headers["Authorization"];

    setToken(null);
    setUser(null);
  };

  // Restore token from localStorage and fetch user info on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        if (api.defaults.headers.common) {
          api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        }
        try {
          const res = await api.get("/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          setUser(res.data);
        } catch (err) {
          console.error("Token verification failed on startup:", err);
          logout();
        }
      } else {
        logout();
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (accessToken) => {
    // 1. Clear any prior credentials before setting new session
    logout();

    // 2. Immediately store new token in localStorage and axios headers
    localStorage.setItem("token", accessToken);
    if (api.defaults.headers.common) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }
    setToken(accessToken);

    // 3. Fetch fresh user information with the new token explicitly in request
    try {
      const res = await api.get("/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(res.data);
      return res.data;
    } catch (e) {
      console.error("Failed to load user info after login:", e);
      logout();
      return null;
    }
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