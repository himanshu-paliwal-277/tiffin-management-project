import api from './axios';

export const getHistory = (params) => api.get('/history', { params });
