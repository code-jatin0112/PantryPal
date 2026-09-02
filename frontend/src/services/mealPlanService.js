import api from './api';
import { MEAL_PLANS } from '../constants/api';

// ── Meal Plan CRUD ─────────────────────────────────────────
export const getMealPlans = (params = {}) => {
  const queryParts = [];
  if (params.startDate) queryParts.push(`startDate=${params.startDate}`);
  if (params.endDate) queryParts.push(`endDate=${params.endDate}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return api.get(`${MEAL_PLANS.LIST}${queryString}`);
};

export const getMealPlanById = (id) =>
  api.get(MEAL_PLANS.DETAIL(id));

export const createMealPlan = (data) =>
  api.post(MEAL_PLANS.CREATE, data);

export const updateMealPlan = (id, data) =>
  api.patch(MEAL_PLANS.UPDATE(id), data);

export const deleteMealPlan = (id) =>
  api.delete(MEAL_PLANS.DELETE(id));

// ── Meal Plan Dishes ───────────────────────────────────────
export const addMealPlanDish = (mealPlanId, data) =>
  api.post(MEAL_PLANS.DISHES(mealPlanId), data);

export const updateMealPlanDish = (mealPlanId, dishId, data) =>
  api.patch(MEAL_PLANS.DISH(mealPlanId, dishId), data);

export const deleteMealPlanDish = (mealPlanId, dishId) =>
  api.delete(MEAL_PLANS.DISH(mealPlanId, dishId));

// ── Evaluation & Grocery Requirements ──────────────────────
export const evaluateMealPlan = (mealPlanId, pantryId) =>
  api.post(MEAL_PLANS.EVALUATE(mealPlanId), { pantryId });

export const getMealPlanGroceryRequirements = (mealPlanId, pantryId) =>
  api.post(MEAL_PLANS.GROCERY_REQUIREMENTS(mealPlanId), { pantryId });
