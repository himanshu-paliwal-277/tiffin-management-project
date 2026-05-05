import api from './axios';

export const getPool = () => api.get('/tiffin/pool');
export const initializePool = (data) => api.post('/tiffin/initialize', data);
export const restockTiffins = (data) => api.post('/tiffin/restock', data);
export const updatePrice = (pricePerTiffin) => api.patch('/tiffin/price', { pricePerTiffin });
export const updateThreshold = (lowAlertThreshold) => api.patch('/tiffin/threshold', { lowAlertThreshold });
