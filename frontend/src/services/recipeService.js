import api from './api';

export const getRecipes = () => api.get('/recipes');
export const getRecipeById = (id) => api.get(`/recipes/${id}`);
export const createRecipe = (data) => api.post('/recipes', data);
export const updateRecipe = (id, data) => api.patch(`/recipes/${id}`, data);
export const deleteRecipe = (id) => api.delete(`/recipes/${id}`);
export const consumeRecipe = (id, data) => api.post(`/recipes/${id}/consume`, data);

export const getFavoriteRecipes = () => api.get('/recipes/favorites');
export const addFavorite = (id) => api.post(`/recipes/${id}/favorite`);
export const removeFavorite = (id) => api.delete(`/recipes/${id}/favorite`);
export const getFavoriteStatus = (id) => api.get(`/recipes/${id}/favorite/status`);

export const getRecipePantryAvailability = (recipeId, pantryId) =>
  api.get(`/recipes/${recipeId}/pantries/${pantryId}/availability`);

export const getRecipeIngredients = (recipeId) =>
  api.get(`/recipes/${recipeId}/ingredients`);

export const getScaledRecipe = (recipeId, servings) =>
  api.get(`/recipes/${recipeId}/scale?servings=${servings}`);
