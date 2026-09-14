import api from './axios';

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'JobSeeker' | 'Recruiter' | 'Admin';
  profile_image?: string;
  is_verified: boolean;
}

export const authApi = {
  login: async (credentials: URLSearchParams) => {
    // The backend expects application/x-www-form-urlencoded
    const response = await api.post('/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
