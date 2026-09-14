import api from './axios';
import { type Job } from './jobs.api';

export interface ApplicationWithDetails {
  application_id: string;
  user_id: string;
  job_id: string;
  resume_id: string | null;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Offer' | 'Hired';
  applied_at: string;
  updated_at: string | null;
  job: Job;
  user?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export const applicationsApi = {
  applyToJob: async (jobId: string, coverLetter?: string): Promise<ApplicationWithDetails> => {
    const payload = {
      job_id: jobId,
      cover_letter: coverLetter,
    };
    const response = await api.post('/applications/', payload);
    return response.data;
  },

  getMyApplications: async (): Promise<ApplicationWithDetails[]> => {
    const response = await api.get('/applications/');
    return response.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string): Promise<ApplicationWithDetails> => {
    const response = await api.put(`/applications/${applicationId}/status`, { status });
    return response.data;
  },
};
