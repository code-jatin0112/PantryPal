import apiClient from "./apiClient";

export const AI_ENDPOINTS = {
  RECOMMENDATIONS: "/ai/recommendations",
  CHAT: "/ai/chat",
  GENERATE_RECIPE: "/ai/generate-recipe",
};

export const aiService = {
  /**
   * Request grounded AI recipe recommendations from pantry stock
   * @param {Object} options - { pantryId, mealType, maxCookTime, servings, dietaryRestrictions }
   */
  async getRecommendations(options = {}) {
    const response = await apiClient.post(
      AI_ENDPOINTS.RECOMMENDATIONS,
      options
    );
    return response.data;
  },

  /**
   * Send a prompt or dialogue to the AI Chef Assistant
   * @param {Object} payload - { message, conversationHistory }
   */
  async sendChatMessage(payload) {
    const response = await apiClient.post(AI_ENDPOINTS.CHAT, payload);
    return response.data;
  },

  /**
   * Generate an ad-hoc custom recipe from selected ingredients
   * @param {Object} payload - { ingredients, cuisine, mealType, servings }
   */
  async generateRecipe(payload) {
    const response = await apiClient.post(
      AI_ENDPOINTS.GENERATE_RECIPE,
      payload
    );
    return response.data;
  },
};

export default aiService;

