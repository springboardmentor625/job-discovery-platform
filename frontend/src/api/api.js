import axios from "axios";

// =========================================================
// AXIOS API INSTANCE
// =========================================================

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    Accept: "application/json",
  },
});

// =========================================================
// REQUEST INTERCEPTOR
// Adds JWT to every protected request
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    const tokenType =
      localStorage.getItem("token_type") || "Bearer";

    // =======================================================
    // ATTACH JWT
    // =======================================================

    if (token) {
      config.headers.Authorization =
        `${tokenType} ${token}`;

      console.log(
        "JWT ATTACHED TO REQUEST:",
        config.headers.Authorization
      );
    } else {
      console.log(
        "NO JWT FOUND IN LOCALSTORAGE"
      );
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================
// RESPONSE INTERCEPTOR
// Handles expired / invalid JWT
// =========================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {
      console.error(
        "401 UNAUTHORIZED:",
        error.response.data
      );

      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
    }

    return Promise.reject(error);
  }
);

// =========================================================
// EXPORT
// =========================================================

export default api;