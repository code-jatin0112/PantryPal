import api from './api';
import { RECIPES } from '../constants/api';

// ── Recipe CRUD ────────────────────────────────────────────
export const getRecipes = () => api.get(RECIPES.LIST);
export const getRecipeById = (id) => api.get(RECIPES.DETAIL(id));
export const createRecipe = (data) => api.post(RECIPES.CREATE, data);
export const updateRecipe = (id, data) => api.patch(RECIPES.UPDATE(id), data);
export const deleteRecipe = (id) => api.delete(RECIPES.DELETE(id));
export const consumeRecipe = (id, data) => api.post(RECIPES.CONSUME(id), data);

// ── Favorites ──────────────────────────────────────────────
export const getFavoriteRecipes = () => api.get(RECIPES.FAVORITES);
export const addFavorite = (id) => api.post(RECIPES.FAVORITE(id));
export const removeFavorite = (id) => api.delete(RECIPES.FAVORITE(id));
export const getFavoriteStatus = (id) => api.get(RECIPES.FAVORITE_STATUS(id));

// ── Pantry Matching ────────────────────────────────────────
export const getRecipePantryAvailability = (recipeId, pantryId, servings) => {
  const query = servings ? `?servings=${servings}` : '';
  return api.get(`${RECIPES.PANTRY_MATCH(recipeId, pantryId)}${query}`);
};

// ── Recipe Ingredients ─────────────────────────────────────
export const getRecipeIngredients = (recipeId) =>
  api.get(RECIPES.INGREDIENTS(recipeId));

export const addRecipeIngredient = (recipeId, data) =>
  api.post(RECIPES.INGREDIENTS(recipeId), data);

export const updateRecipeIngredient = (recipeId, ingredientId, data) =>
  api.patch(`/recipes/${recipeId}/ingredients/${ingredientId}`, data);

export const deleteRecipeIngredient = (recipeId, ingredientId) =>
  api.delete(`/recipes/${recipeId}/ingredients/${ingredientId}`);

// ── Serving Scaling ────────────────────────────────────────
export const scaleRecipeServings = async (recipeId, servings) => {
  try {
    return await api.post(`/recipes/${recipeId}/scale`, { servings: Number(servings) });
  } catch (err) {
    // Fallback to GET query scaling if POST is unavailable
    return await api.get(`/recipes/${recipeId}/scale?servings=${servings}`);
  }
};

export const getScaledRecipe = scaleRecipeServings;

// ── Nutrition ──────────────────────────────────────────────
export const getRecipeNutrition = (recipeId) =>
  api.get(RECIPES.NUTRITION(recipeId));

export const updateRecipeNutrition = (recipeId, data) =>
  api.post(RECIPES.NUTRITION(recipeId), data);
