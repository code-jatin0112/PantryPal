import api from './api';

export const getMealPlans = () => api.get('/meal-plans');

export const getShoppingList = () => api.get('/shopping-list');
export const updateShoppingListItem = (itemId, data) => api.patch(`/shopping-list/${itemId}`, data);
export const clearPurchasedItems = () => api.delete('/shopping-list/purchased');
