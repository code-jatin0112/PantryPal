import apiClient from "./apiClient";

export const MEAL_PLAN_ENDPOINTS = {
  MEAL_PLANS: "/meal-plans",
  MEAL_PLAN_BY_ID: (id) => `/meal-plans/${id}`,
};

export const mealPlanService = {
  /**
   * Fetch all meal plans for user
   * @param {Object} params - { page, limit }
   */
  async getMealPlans(params = {}) {
    const response = await apiClient.get(MEAL_PLAN_ENDPOINTS.MEAL_PLANS, {
      params,
    });
    return response.data;
  },

  /**
   * Fetch a single meal plan by ID
   * @param {string} id
   */
  async getMealPlanById(id) {
    const response = await apiClient.get(
      MEAL_PLAN_ENDPOINTS.MEAL_PLAN_BY_ID(id)
    );
    return response.data;
  },

  /**
   * Create a new meal plan
   * @param {Object} planData - { name, startDate, endDate, peopleCount, budget, meals }
   */
  async createMealPlan(planData) {
    const response = await apiClient.post(
      MEAL_PLAN_ENDPOINTS.MEAL_PLANS,
      planData
    );
    return response.data;
  },

  /**
   * Update an existing meal plan
   * @param {string} id
   * @param {Object} updateData
   */
  async updateMealPlan(id, updateData) {
    const response = await apiClient.put(
      MEAL_PLAN_ENDPOINTS.MEAL_PLAN_BY_ID(id),
      updateData
    );
    return response.data;
  },

  /**
   * Delete a meal plan
   * @param {string} id
   */
  async deleteMealPlan(id) {
    const response = await apiClient.delete(
      MEAL_PLAN_ENDPOINTS.MEAL_PLAN_BY_ID(id)
    );
    return response.data;
  },
};

export default mealPlanService;

