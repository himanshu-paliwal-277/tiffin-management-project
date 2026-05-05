import api from './axios';

export const createEntry = (data) => api.post('/entries', data);
export const updateEntry = (id, data) => api.put(`/entries/${id}`, data);
export const getEntries = (params) => api.get('/entries', { params });
export const getMonthlySummary = (month, year) =>
  api.get('/entries/summary', { params: { month, year } });
export const getDailyTrend = (params) => api.get('/entries/trend', { params });
