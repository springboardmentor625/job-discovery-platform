import api from './axios';

export interface Profile {
  profile_id: string;
  user_id: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  experience_years: number;
  education: Array<{ degree?: string; institution?: string; year?: number; [key: string]: any }>;
  expected_salary?: number;
  notice_period?: string;
  resume_headline?: string;
  created_at: string;
  updated_at?: string;
}

export type ProfileUpdate = Partial<Omit<Profile, 'profile_id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const profilesApi = {
  getMyProfile: async (): Promise<Profile> => {
    const response = await api.get('/profiles/me');
    return response.data;
  },

  updateMyProfile: async (data: ProfileUpdate): Promise<Profile> => {
    const response = await api.put('/profiles/me', data);
    return response.data;
  },
};
