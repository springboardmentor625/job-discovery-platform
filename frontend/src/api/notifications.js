import api from './axios';

export function getNotifications() {
  return api.get('/notifications').then(({ data }) => data);
}
