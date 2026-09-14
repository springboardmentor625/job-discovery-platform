import api from './axios';

// ─── Types matching backend schemas exactly ───────────────────────────────────

export interface Job {
  job_id: string;
  recruiter_id: string;
  company_id: string;
  job_title: string;
  job_description: string;
  required_skills: string[];
  experience_required?: number;
  location?: string;
  job_type?: string;
  salary_min?: number;
  salary_max?: number;
  posted_date: string;
  closing_date?: string;
  status: 'Active' | 'Closed' | 'Draft';
  views_count: number;
  applicant_count: number;
  created_at: string;
  updated_at?: string;
  // Computed properties from backend
  company_name?: string;
  company_logo?: string;
}

export interface JobRecommendation {
  job: Job;
  match_percentage: int;
  matched_skills: string[];
  missing_skills: string[];
  recommendation_score: number;
  reasons: string[];
  recommendation_reason: string;
}

export interface MatchBreakdown {
  skills_match: number;
  experience_match: number;
  location_match: number;
  preference_match: number;
  resume_keyword_match: number;
}

export interface MatchExplanationResponse {
  job_id: string;
  overall_match_score: number;
  breakdown: MatchBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  improvement_areas: string[];
  explanation: string;
}

export interface SkillPriority {
  skill: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SkillGapResponse {
  job_id: string;
  skill_match_percentage: number;
  matched_skills: string[];
  missing_skills: SkillPriority[];
  recommendation: string;
}

export interface SavedJobRecord {
  saved_id: string;
  user_id: string;
  job_id: string;
  saved_at: string;
  job: Job;
}

export interface SwipeAction {
  job_id: string;
  swipe_type: 'Right' | 'Left';
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const jobsApi = {
  createJob: async (data: Partial<Job>): Promise<Job> => {
    const response = await api.post('/jobs/', data);
    return response.data;
  },
  
  getMyJobs: async (): Promise<Job[]> => {
    const response = await api.get('/jobs/me');
    return response.data;
  },

  /** Returns all active jobs (no auth required). */
  getAllJobs: async (skip = 0, limit = 50): Promise<Job[]> => {
    const response = await api.get('/jobs/', { params: { skip, limit } });
    return response.data;
  },

  /** Returns personalized recommendations for the logged-in JobSeeker. */
  getRecommendations: async (skip = 0, limit = 50): Promise<JobRecommendation[]> => {
    const response = await api.get('/jobs/recommendations', { params: { skip, limit } });
    return response.data;
  },

  getMatchExplanation: async (jobId: string): Promise<MatchExplanationResponse> => {
    const response = await api.get(`/jobs/${jobId}/match-explanation`);
    return response.data;
  },

  getSkillGap: async (jobId: string): Promise<SkillGapResponse> => {
    const response = await api.get(`/jobs/${jobId}/skill-gap`);
    return response.data;
  },

  getJobById: async (jobId: string): Promise<Job> => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  deleteJob: async (jobId: string) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // ─── Swipe ────────────────────────────────────────────────────────────────

  swipeRight: async (jobId: string) => {
    const payload: SwipeAction = { job_id: jobId, swipe_type: 'Right' };
    const response = await api.post('/swipes/', payload);
    return response.data;
  },

  swipeLeft: async (jobId: string) => {
    const payload: SwipeAction = { job_id: jobId, swipe_type: 'Left' };
    const response = await api.post('/swipes/', payload);
    return response.data;
  },

  getSwipeHistory: async () => {
    const response = await api.get('/swipes/history');
    return response.data;
  },

  // ─── Saved Jobs ───────────────────────────────────────────────────────────

  saveJob: async (jobId: string) => {
    const response = await api.post('/saved_jobs/', { job_id: jobId });
    return response.data;
  },

  getSavedJobs: async (): Promise<SavedJobRecord[]> => {
    const response = await api.get('/saved_jobs/');
    return response.data;
  },

  removeSavedJob: async (jobId: string) => {
    const response = await api.delete(`/saved_jobs/${jobId}`);
    return response.data;
  },
};
