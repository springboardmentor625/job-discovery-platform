const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    let errorMessage = 'Request failed';
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map((err) => {
            const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : '';
            return field ? `${field}: ${err.msg}` : err.msg;
          })
          .join(' | ');
      } else if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else {
        errorMessage = JSON.stringify(data.detail);
      }
    }
    throw new Error(errorMessage);
  }
  return data;
}
export async function registerCandidate(payload) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function loginCandidate(payload) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function forgotPasswordCandidate(payload) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function fetchCurrentUser(token) {
  const timestamp = new Date().getTime();
  return apiRequest(`/api/auth/me?t=${timestamp}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });
}
export async function uploadProfilePicture(token, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/api/auth/profile-picture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new Error(data?.detail || 'Failed to upload picture');
  }
  return data;
}
export async function removeProfilePicture(token) {
  return apiRequest('/api/auth/profile-picture', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
export async function updateCandidateProfile(token, payload) {
  return apiRequest('/api/auth/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}