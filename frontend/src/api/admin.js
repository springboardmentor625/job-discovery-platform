import api from './axios';

export function getAdminOverview() {
  return api.get('/admin/overview').then(({ data }) => data);
}

export function getAdminActivity(limit = 100) {
  return api.get('/admin/activity', { params: { limit } }).then(({ data }) => data);
}

export function getAdminUsers() {
  return api.get('/admin/users').then(({ data }) => data);
}

export function toggleUserSuspension(userId, suspended) {
  return api.patch(`/admin/users/${userId}/suspension`, null, { params: { suspended } }).then(({ data }) => data);
}
