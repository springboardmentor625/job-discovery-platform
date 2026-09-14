import api from './axios';

export interface Company {
  company_id: string;
  user_id: string;
  company_name: string;
  about: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  company_size: string | null;
  logo: string | null;
}

export const companiesApi = {
  createCompany: async (data: Partial<Company>): Promise<Company> => {
    const response = await api.post('/companies/', data);
    return response.data;
  },
  
  updateCompany: async (companyId: string, data: Partial<Company>): Promise<Company> => {
    const response = await api.put(`/companies/${companyId}`, data);
    return response.data;
  },
  
  getCompany: async (companyId: string): Promise<Company> => {
    const response = await api.get(`/companies/${companyId}`);
    return response.data;
  },
  
  getMyCompany: async (): Promise<Company> => {
    const response = await api.get('/companies/me');
    return response.data;
  },
};
