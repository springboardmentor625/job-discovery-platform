import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach latest token from localStorage for protected endpoints; never leak token to public auth endpoints
api.interceptors.request.use((config) => {
  const publicAuthEndpoints = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthEndpoint = publicAuthEndpoints.some((ep) =>
    config.url?.includes(ep)
  );

  if (isAuthEndpoint) {
    if (config.headers) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Authorization");
      }
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }
    return config;
  }

  const token = localStorage.getItem("token");

  if (token) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else if (config.headers) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Authorization");
    }
    delete config.headers.Authorization;
    delete config.headers.authorization;
  }

  return config;
});

// Handle 401 responses safely without wiping newly established sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestAuth =
        error.config?.headers?.Authorization ||
        error.config?.headers?.authorization;
      const currentToken = localStorage.getItem("token");

      // Only invalidate session if the request actually failed using the currently active token
      if (requestAuth && currentToken && requestAuth === `Bearer ${currentToken}`) {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
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
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;