import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const getAuthHeaders = () => {
  const token = localStorage.getItem('swipex_token');
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('swipex_token');
  const response = await axios.post(`${API_URL}/api/candidate/resume`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
export const getResume = async () => {
  const response = await axios.get(`${API_URL}/api/candidate/resume`, getAuthHeaders());
  return response.data;
};
export const getATSReport = async () => {
  const response = await axios.get(`${API_URL}/api/candidate/ats`, getAuthHeaders());
  return response.data;
};
export const getJobRecommendations = async () => {
  const response = await axios.get(`${API_URL}/api/candidate/jobs/recommendations`, getAuthHeaders());
  return response.data;
};
export const swipeJob = async (jobId, action) => {
  const response = await axios.post(`${API_URL}/api/candidate/jobs/swipe`, { job_id: jobId, action }, getAuthHeaders());
  return response.data;
};
export const getSavedJobs = async () => {
  const response = await axios.get(`${API_URL}/api/candidate/jobs/saved`, getAuthHeaders());
  return response.data;
};
export const unsaveJob = async (jobId) => {
  const response = await axios.delete(`${API_URL}/api/candidate/jobs/saved/${jobId}`, getAuthHeaders());
  return response.data;
};
export const getJobTypes = async () => {
  const response = await axios.get(`${API_URL}/api/candidate/job-types`, getAuthHeaders());
  return response.data;
};