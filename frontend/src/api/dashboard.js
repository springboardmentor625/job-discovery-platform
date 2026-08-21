import api from './axios';

export function getApplications() {
	return api.get('/applications').then(({ data }) => data);
}

export function getDashboardStats() {
	return api.get('/dashboard').then(({ data }) => data);
}
