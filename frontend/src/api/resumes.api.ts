import api from './axios';

export interface Resume {
  resume_id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  ats_score: number | null;
  extracted_skills: string[];
  missing_keywords: string[];
  uploaded_at: string;
  is_primary: boolean;
}

export interface ResumeAnalysis {
  ats_score: number;
  extracted_skills: string[];
  missing_keywords: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
}

export const resumesApi = {
  uploadResume: async (file: File, title: string): Promise<Resume> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    
    const response = await api.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getResumes: async (): Promise<Resume[]> => {
    const response = await api.get('/resumes/');
    return response.data;
  },

  analyzeResume: async (resumeId: string): Promise<ResumeAnalysis> => {
    const response = await api.post(`/resumes/${resumeId}/analyze`);
    return response.data;
  },

  deleteResume: async (resumeId: string): Promise<void> => {
    await api.delete(`/resumes/${resumeId}`);
  },
};
