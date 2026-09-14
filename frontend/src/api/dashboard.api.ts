import api from './axios';

export interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}

export interface ActivityItem {
  type: string;
  company: string;
  role: string;
  status: string;
  date: string;
}

export interface JobSeekerDashboardStats {
  stats: StatCard[];
  recent_activity: ActivityItem[];
  profile_completion_percentage: number;
  new_matches_count: number;
}

export const dashboardApi = {
  getJobSeekerDashboard: async (): Promise<JobSeekerDashboardStats> => {
    const response = await api.get('/dashboard/job-seeker');
    return response.data;
  }
};
