import api from './axios';

export async function registerUser(name, email, password, role = 'seeker') {
  const { data } = await api.post('/auth/register', { name, email, password, role });
  return { token: data.access_token, user: data.user };
}

export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return { token: data.access_token, user: data.user };
}

export function logoutUser() {
  return Promise.resolve({ success: true });
}
