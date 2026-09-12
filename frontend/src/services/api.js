import axios from "axios";
import { store } from "../store/store";
import { setCredentials, logout } from "../store/authSlice";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({ baseURL: BASE_URL });
export const fetchAtsScore = (jobId) => api.get(`/jobs/${jobId}/ats-score/`);
// Attach the current access token to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, try to refresh the access token once, then retry the request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = store.getState().auth.refreshToken;
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          store.dispatch(
            setCredentials({
              user: store.getState().auth.user,
              access: data.access,
              refresh,
            })
          );
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          store.dispatch(logout());
        }
      } else {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export const registerUser = (payload) => api.post("/auth/register/", payload);
export const loginUser = (payload) => api.post("/auth/login/", payload);
export const fetchMe = () => api.get("/auth/me/");
export const updateProfile = (payload) => api.patch("/auth/me/", payload);

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/resumes/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const fetchResumes = () => api.get("/resumes/");

export const fetchRecommendedJobs = () => api.get("/jobs/recommended/");
export const submitSwipe = (jobId, direction) =>
  api.post("/swipes/", { job: jobId, direction });

export const fetchApplications = (status) =>
  api.get("/applications/", { params: status ? { status } : {} });
export const fetchNotifications = (unreadOnly) =>
  api.get("/notifications/", { params: unreadOnly ? { unread_only: "true" } : {} });
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => api.post("/notifications/read-all/");

export const fetchAnalyticsSummary = () => api.get("/analytics/summary/");
