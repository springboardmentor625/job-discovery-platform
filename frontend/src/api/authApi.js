import apiClient from './apiClient';

export async function registerCandidate(payload) {
  return apiClient.post('/api/auth/register', payload);
}

export async function loginCandidate(payload) {
  return apiClient.post('/api/auth/login', payload);
}

export async function forgotPasswordCandidate(payload) {
  return apiClient.post('/api/auth/forgot-password', payload);
}

export async function resetPasswordCandidate(payload) {
  return apiClient.post('/api/auth/reset-password', payload);
}

export async function fetchCurrentUser() {
  const timestamp = new Date().getTime();
  return apiClient.get(`/api/auth/me?t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/api/auth/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export async function removeProfilePicture() {
  return apiClient.delete('/api/auth/profile-picture');
}

export async function updateCandidateProfile(payload) {
  return apiClient.put('/api/auth/profile', payload);
}
