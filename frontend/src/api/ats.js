import api from './axios';

export function runAtsWorkflow(jobId, applicationId = null) {
  return api.post('/ats-workflow/run', { job_id: jobId, application_id: applicationId }).then(({ data }) => data);
}

export function getAtsReport(reportId) {
  return api.get(`/ats-reports/${reportId}`).then(({ data }) => data);
}

export function getApplicationAtsReport(applicationId) {
  return api.get(`/applications/${applicationId}/ats-report`).then(({ data }) => data);
}
