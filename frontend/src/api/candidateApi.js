import apiClient from './apiClient';

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/api/candidate/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getResume = async () => {
  return apiClient.get('/api/candidate/resume');
};

export const getATSReport = async () => {
  return apiClient.get('/api/candidate/ats');
};

export const getJobRecommendations = async () => {
  return apiClient.get('/api/candidate/jobs/recommendations');
};

export const swipeJob = async (jobId, action) => {
  return apiClient.post('/api/candidate/jobs/swipe', { job_id: jobId, action });
};

export const getSavedJobs = async () => {
  return apiClient.get('/api/candidate/jobs/saved');
};

export const unsaveJob = async (jobId) => {
  return apiClient.delete(`/api/candidate/jobs/saved/${jobId}`);
};

export const getJobTypes = async () => {
  return apiClient.get('/api/candidate/job-types');
};

export const getApplications = async () => {
  return apiClient.get('/api/candidate/applications');
};
