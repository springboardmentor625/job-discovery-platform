import axios from "axios";

const getApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE;
  const hostname =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";

  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `http://${hostname}:8001/api/`;
  }

  return envBase || `http://${hostname}:8001/api/`;
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      if (
        currentPath !== "/" &&
        currentPath !== "/register"
      ) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;