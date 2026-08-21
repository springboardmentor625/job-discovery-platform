import api from './axios';

function parseSkillsFromName(fileName) {
  const lower = fileName.toLowerCase();
  const skills = [];
  if (lower.includes('react')) skills.push('React');
  if (lower.includes('python')) skills.push('Python');
  if (lower.includes('sql')) skills.push('SQL');
  if (lower.includes('node')) skills.push('Node.js');
  if (lower.includes('java')) skills.push('Java');
  if (skills.length === 0) skills.push('Communication', 'Problem Solving', 'Git');
  return skills;
}

export function getProfile() {
  return api.get('/profile').then(({ data }) => data);
}

export function updateProfile(profile) {
  const safeProfile = {
    headline: profile.headline || '',
    about: profile.about || '',
    location: profile.location || '',
    preferred_role: profile.preferred_role || '',
    preferred_locations: profile.preferred_locations || '',
    experience_years: profile.experience_years || '',
    portfolio_url: profile.portfolio_url || '',
    linkedin_url: profile.linkedin_url || '',
    github_url: profile.github_url || '',
    hackerrank_url: profile.hackerrank_url || '',
    leetcode_url: profile.leetcode_url || '',
    github_projects_url: profile.github_projects_url || '',
    college_name: profile.college_name || '',
    graduation_year: profile.graduation_year || '',
    cgpa: profile.cgpa || '',
    projects_summary: profile.projects_summary || '',
    work_authorization: profile.work_authorization || '',
    remote_preference: profile.remote_preference || 'Hybrid',
    notice_period: profile.notice_period || '',
    min_salary: profile.min_salary || '',
    job_type: profile.job_type || '',
    education: profile.education || '',
    availability: profile.availability || 'Open to opportunities',
    skills: Array.isArray(profile.skills) ? profile.skills : [],
  };
  return api.put('/profile', safeProfile).then(({ data }) => ({ success: true, profile: data }));
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/resumes/analyze', formData);
  return data;
}
