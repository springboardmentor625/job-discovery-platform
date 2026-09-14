import api from './axios';

export interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}

export interface RecruiterActivityItem {
  type: string;
  applicant_name: string;
  role: string;
  status: string;
  date: string;
}

export interface RecruiterDashboardStats {
  stats: StatCard[];
  recent_activity: RecruiterActivityItem[];
  has_company: boolean;
}

export const recruiterDashboardApi = {
  getStats: async (): Promise<RecruiterDashboardStats> => {
    const response = await api.get('/dashboard/recruiter');
    return response.data;
  },
};
