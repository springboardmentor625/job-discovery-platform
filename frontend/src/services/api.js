import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Always attach the latest token from localStorage; remove stale header if no token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

// Handle 401 responses safely without wiping newly established sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestAuth = error.config?.headers?.Authorization;
      const currentToken = localStorage.getItem("token");

      // Only invalidate session if the request actually failed using the currently active token
      if (requestAuth && currentToken && requestAuth === `Bearer ${currentToken}`) {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;