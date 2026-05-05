import api from './axios';

export const getUsers = () => api.get('/users');
export const addUser = (data) => api.post('/users', data);
export const removeUser = (id) => api.delete(`/users/${id}`);
