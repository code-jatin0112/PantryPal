import api from './api';

// --- Pantry CRUD ---
export const getPantries = () => api.get('/pantries');
export const createPantry = (data) => api.post('/pantries', data);
export const deletePantry = (pantryId) => api.delete(`/pantries/${pantryId}`);

// --- Pantry Items CRUD ---
export const getPantryItems = (pantryId) => api.get(`/pantries/${pantryId}/items`);
export const createPantryItem = (pantryId, data) => api.post(`/pantries/${pantryId}/items`, data);
export const updatePantryItem = (pantryId, itemId, data) => api.patch(`/pantries/${pantryId}/items/${itemId}`, data);
export const deletePantryItem = (pantryId, itemId) => api.delete(`/pantries/${pantryId}/items/${itemId}`);
export const adjustStock = (pantryId, itemId, data) => api.post(`/pantries/${pantryId}/items/${itemId}/adjust`, data);

// --- Alerts ---
export const getExpiringItems = (pantryId, days = 7) => api.get(`/pantries/${pantryId}/expiring?days=${days}`);
export const getExpiredItems = (pantryId) => api.get(`/pantries/${pantryId}/expired`);
export const getLowStockItems = (pantryId) => api.get(`/pantries/${pantryId}/low-stock`);
