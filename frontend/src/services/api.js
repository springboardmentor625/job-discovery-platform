import axios from "axios";
import { store } from "../store/store";
import { setCredentials, logout } from "../store/authSlice";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({ baseURL: BASE_URL });
export const BACKEND_ROOT_URL = BASE_URL.replace(/\/api\/?$/, "");
export const fetchAtsScore = (jobId) => api.get(`/jobs/${jobId}/ats-score/`);
export const fetchJobDescription = (jobId) => api.get(`/jobs/${jobId}/description/`);
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

export const uploadResume = (file, targetRole) => {
  const formData = new FormData();
  formData.append("file", file);
  if (targetRole) formData.append("target_role", targetRole);
  return api.post("/resumes/", formData, { headers: { "Content-Type": "multipart/form-data" } });
};
export const fetchResumes = () => api.get("/resumes/");
export const activateResume = (id) => api.post(`/resumes/${id}/activate/`);
export const deleteResume = (id) => api.delete(`/resumes/${id}/`);

export const fetchRecommendedJobs = (filters = {}) => api.get("/jobs/recommended/", { params: filters });
export const fetchJobs = (filters = {}) => api.get("/jobs/", { params: filters });
export const fetchCompanies = (companyType) =>
  api.get("/jobs/companies/", { params: companyType ? { company_type: companyType } : {} });

export const submitSwipe = (jobId, direction) =>
  api.post("/swipes/", { job: jobId, direction });

export const fetchApplications = (status) =>
  api.get("/applications/", { params: status ? { status } : {} });
export const fetchNotifications = (unreadOnly) =>
  api.get("/notifications/", { params: unreadOnly ? { unread_only: "true" } : {} });
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => api.post("/notifications/read-all/");

export const fetchAnalyticsSummary = () => api.get("/analytics/summary/");