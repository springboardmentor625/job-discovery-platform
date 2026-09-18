import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
});

delete api.defaults.headers.common.Authorization;

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    config.headers = config.headers || {};
    delete config.headers.Authorization;
    delete config.headers.authorization;
    config.headers['Cache-Control'] = 'no-store';
    config.headers.Pragma = 'no-cache';
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user_id');
        }
        return Promise.reject(error);
    }
);

export default api;
