import apiClient from "./apiClient";

export const RECIPE_ENDPOINTS = {
  RECIPES: "/recipes",
  RECIPE_BY_ID: (id) => `/recipes/${id}`,
  SAVED_RECIPES: "/recipes/saved",
  SAVE_RECIPE: (id) => `/recipes/${id}/save`,
  RATE_RECIPE: (id) => `/recipes/${id}/ratings`,
  RECIPE_HISTORY: (id) => `/recipes/${id}/history`,
  SCALE_RECIPE: (id) => `/recipes/${id}/scale`,
  PANTRY_MATCH: (recipeId, pantryId) => `/recipes/${recipeId}/pantries/${pantryId}/match`,
};

export const recipeService = {
  /**
   * Fetch recipes with pagination, filters, and search
   * @param {Object} params - { page, limit, cuisine, difficulty, maxTime, search }
   */
  async getRecipes(params = {}) {
    const response = await apiClient.get(RECIPE_ENDPOINTS.RECIPES, { params });
    return response.data;
  },

  /**
   * Fetch a single recipe by ID
   * @param {string} id
   */
  async getRecipeById(id) {
    const response = await apiClient.get(RECIPE_ENDPOINTS.RECIPE_BY_ID(id));
    return response.data;
  },

  /**
   * Create a new custom recipe
   * @param {Object} recipeData
   */
  async createRecipe(recipeData) {
    const response = await apiClient.post(RECIPE_ENDPOINTS.RECIPES, recipeData);
    return response.data;
  },

  /**
   * Update an existing recipe
   * @param {string} id
   * @param {Object} updateData
   */
  async updateRecipe(id, updateData) {
    const response = await apiClient.put(
      RECIPE_ENDPOINTS.RECIPE_BY_ID(id),
      updateData
    );
    return response.data;
  },

  /**
   * Delete a recipe
   * @param {string} id
   */
  async deleteRecipe(id) {
    const response = await apiClient.delete(RECIPE_ENDPOINTS.RECIPE_BY_ID(id));
    return response.data;
  },

  /**
   * Get all user saved/bookmarked recipes
   * @param {Object} params - { page, limit }
   */
  async getSavedRecipes(params = {}) {
    const response = await apiClient.get(RECIPE_ENDPOINTS.SAVED_RECIPES, {
      params,
    });
    return response.data;
  },

  /**
   * Toggle save/favorite recipe
   * @param {string} id
   * @param {string} notes
   */
  async saveRecipe(id, notes = "") {
    const response = await apiClient.post(RECIPE_ENDPOINTS.SAVE_RECIPE(id), {
      notes,
    });
    return response.data;
  },

  /**
   * Unsave/unfavorite recipe
   * @param {string} id
   */
  async unsaveRecipe(id) {
    const response = await apiClient.delete(RECIPE_ENDPOINTS.SAVE_RECIPE(id));
    return response.data;
  },

  /**
   * Submit recipe rating
   * @param {string} id
   * @param {number} rating - 1 to 5
   * @param {string} review
   */
  async rateRecipe(id, rating, review = "") {
    const response = await apiClient.post(RECIPE_ENDPOINTS.RATE_RECIPE(id), {
      rating,
      review,
    });
    return response.data;
  },

  /**
   * Scale recipe ingredients to custom headcount
   * @param {string} id
   * @param {number} targetServings
   */
  async scaleRecipe(id, targetServings) {
    const response = await apiClient.get(RECIPE_ENDPOINTS.SCALE_RECIPE(id), {
      params: { targetServings },
    });
    return response.data;
  },

  /**
   * Match recipe ingredients against user pantry
   * @param {string} recipeId
   * @param {string} pantryId
   */
  async matchPantry(recipeId, pantryId) {
    const response = await apiClient.get(
      RECIPE_ENDPOINTS.PANTRY_MATCH(recipeId, pantryId)
    );
    return response.data;
  },
};

export default recipeService;

