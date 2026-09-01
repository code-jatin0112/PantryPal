import api from './api';

export const getMealPlans = () => api.get('/meal-plans');
export const getMealPlanById = (id) => api.get(`/meal-plans/${id}`);
export const createMealPlan = (data) => api.post('/meal-plans', data);
export const updateMealPlan = (id, data) => api.patch(`/meal-plans/${id}`, data);
export const deleteMealPlan = (id) => api.delete(`/meal-plans/${id}`);

export const addDish = (mealPlanId, data) => api.post(`/meal-plans/${mealPlanId}/dishes`, data);
export const updateDish = (mealPlanId, dishId, data) => api.patch(`/meal-plans/${mealPlanId}/dishes/${dishId}`, data);
export const deleteDish = (mealPlanId, dishId) => api.delete(`/meal-plans/${mealPlanId}/dishes/${dishId}`);

export const evaluateMealPlan = (mealPlanId, data) => api.post(`/meal-plans/${mealPlanId}/evaluate`, data);
export const getGroceryRequirements = (mealPlanId, data) => api.post(`/meal-plans/${mealPlanId}/grocery-requirements`, data);
