import api from './axios';

function mapJobSkills(job) {
  if (!job) return job;
  return {
    ...job,
    required_skills: Array.isArray(job.skills) ? job.skills : job.required_skills || [],
  };
}

export function getRecommendedJobs() {
  return api.get('/jobs').then(({ data }) => data.map(mapJobSkills));
}

export function getSavedJobs() {
  return api.get('/saved').then(({ data }) => data.map(mapJobSkills));
}

export function createJob(jobData) {
  return api.post('/jobs', jobData).then(({ data }) => mapJobSkills(data));
}

export function deleteJob(jobId) {
  return api.delete(`/jobs/${jobId}`).then(({ data }) => data);
}

export function getRecruiterCandidates(jobId = null, status = null) {
  const params = {};
  if (jobId) params.job_id = jobId;
  if (status) params.status = status;
  return api.get('/recruiter/candidates', { params }).then(({ data }) => data);
}

export function recordSwipe(jobId, decision, matchScore) {
  return api.post('/swipes', { job_id: jobId, decision, match_score: matchScore }).then(({ data }) => data);
}

export function updateApplicationStatus(applicationId, status) {
  return api.patch(`/applications/${applicationId}/status`, { status }).then(({ data }) => data);
}

