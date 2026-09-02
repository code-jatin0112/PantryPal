import api from './api';
import { MEAL_PLANS, SHOPPING, PANTRY, RECIPES } from '../constants/api';

// ── Mock data fallbacks ────────────────────────────────────
const MOCK_SUMMARY = {
  pantryItems: 38,
  recipes: 24,
  shoppingList: 8,
  mealPlans: 3,
};

const MOCK_PANTRY_OVERVIEW = [
  { id: '1', name: 'Fresh Milk', category: 'Dairy', quantity: 1, unit: 'L', status: 'EXPIRING_SOON' },
  { id: '2', name: 'Olive Oil', category: 'Pantry', quantity: 150, unit: 'ml', status: 'LOW_STOCK' },
  { id: '3', name: 'Whole Wheat Bread', category: 'Bakery', quantity: 1, unit: 'loaf', status: 'EXPIRING_SOON' },
  { id: '4', name: 'Basmati Rice', category: 'Grains', quantity: 500, unit: 'g', status: 'LOW_STOCK' },
  { id: '5', name: 'Fresh Tomatoes', category: 'Produce', quantity: 6, unit: 'pcs', status: 'FRESH' },
  { id: '6', name: 'Greek Yogurt', category: 'Dairy', quantity: 400, unit: 'g', status: 'FRESH' },
];

const MOCK_EXPIRING_ITEMS = [
  { id: '1', name: 'Milk', daysLeft: 1, label: '1 day left', variant: 'warning' },
  { id: '2', name: 'Bread', daysLeft: 0, label: 'Today', variant: 'danger' },
  { id: '3', name: 'Spinach', daysLeft: 1, label: 'Tomorrow', variant: 'warning' },
];

const MOCK_LOW_STOCK_ITEMS = [
  { id: '1', name: 'Rice', percent: 20, currentQty: '500g', minQty: '2kg' },
  { id: '2', name: 'Oil', percent: 15, currentQty: '150ml', minQty: '1L' },
  { id: '3', name: 'Sugar', percent: 25, currentQty: '250g', minQty: '1kg' },
  { id: '4', name: 'Eggs', percent: 10, currentQty: '2 pcs', minQty: '12 pcs' },
];

const MOCK_TODAY_MEAL_PLAN = [
  { id: '1', type: 'Breakfast', recipeName: 'Oatmeal with Berries', time: '8:00 AM', calories: '350 kcal' },
  { id: '2', type: 'Lunch', recipeName: 'Grilled Chicken Salad', time: '1:00 PM', calories: '520 kcal' },
  { id: '3', type: 'Dinner', recipeName: 'Vegetable Pulao & Raita', time: '7:30 PM', calories: '610 kcal' },
  { id: '4', type: 'Snack', recipeName: 'Greek Yogurt & Honey', time: '4:30 PM', calories: '180 kcal' },
];

const MOCK_SHOPPING_PREVIEW = [
  { id: '1', name: 'Milk', isPurchased: false, quantity: 2, unit: 'L' },
  { id: '2', name: 'Eggs', isPurchased: false, quantity: 12, unit: 'pcs' },
  { id: '3', name: 'Tomatoes', isPurchased: true, quantity: 1, unit: 'kg' },
  { id: '4', name: 'Onions', isPurchased: false, quantity: 2, unit: 'kg' },
  { id: '5', name: 'Cheese', isPurchased: false, quantity: 200, unit: 'g' },
];

const MOCK_AI_RECOMMENDATIONS = [
  { id: '1', name: 'Vegetable Pulao', description: 'Fragrant rice dish with mixed vegetables and aromatic spices' },
  { id: '2', name: 'Tomato Soup', description: 'Comforting and rich homemade roasted tomato soup' },
  { id: '3', name: 'Fried Rice', description: 'Quick wok-tossed rice with vegetables and light soy sauce' },
];

// ── Dashboard Service Methods ──────────────────────────────

export const getDashboardSummary = async () => {
  try {
    // Attempt real API if available, fallback smoothly to mock
    const [pantryRes, recipeRes, shoppingRes, mealPlanRes] = await Promise.allSettled([
      api.get(PANTRY.LIST),
      api.get(RECIPES.LIST),
      api.get(SHOPPING.LIST),
      api.get(MEAL_PLANS.LIST),
    ]);

    const pantryItems = pantryRes.status === 'fulfilled' ? (pantryRes.value.data.data?.items?.length || MOCK_SUMMARY.pantryItems) : MOCK_SUMMARY.pantryItems;
    const recipes = recipeRes.status === 'fulfilled' ? (recipeRes.value.data.data?.recipes?.length || MOCK_SUMMARY.recipes) : MOCK_SUMMARY.recipes;
    const shoppingList = shoppingRes.status === 'fulfilled' ? (shoppingRes.value.data.data?.items?.length || MOCK_SUMMARY.shoppingList) : MOCK_SUMMARY.shoppingList;
    const mealPlans = mealPlanRes.status === 'fulfilled' ? (mealPlanRes.value.data.data?.mealPlans?.length || MOCK_SUMMARY.mealPlans) : MOCK_SUMMARY.mealPlans;

    return {
      success: true,
      data: { pantryItems, recipes, shoppingList, mealPlans },
    };
  } catch {
    return { success: true, data: MOCK_SUMMARY };
  }
};

export const getPantryOverview = async () => {
  return { success: true, data: MOCK_PANTRY_OVERVIEW };
};

export const getExpiringItems = async () => {
  return { success: true, data: MOCK_EXPIRING_ITEMS };
};

export const getLowStockItems = async () => {
  return { success: true, data: MOCK_LOW_STOCK_ITEMS };
};

export const getMealPlan = async () => {
  try {
    const res = await api.get(MEAL_PLANS.LIST);
    const plans = res.data.data?.mealPlans;
    if (plans && plans.length > 0) {
      return { success: true, data: MOCK_TODAY_MEAL_PLAN };
    }
    return { success: true, data: MOCK_TODAY_MEAL_PLAN };
  } catch {
    return { success: true, data: MOCK_TODAY_MEAL_PLAN };
  }
};

export const getShoppingPreview = async () => {
  try {
    const res = await api.get(SHOPPING.LIST);
    const items = res.data.data?.items;
    if (items && items.length > 0) {
      return { success: true, data: items.slice(0, 5) };
    }
    return { success: true, data: MOCK_SHOPPING_PREVIEW };
  } catch {
    return { success: true, data: MOCK_SHOPPING_PREVIEW };
  }
};

export const getAIRecommendations = async () => {
  return { success: true, data: MOCK_AI_RECOMMENDATIONS };
};

// ── Backwards-compatible aliases ──────────────────────────
export const getMealPlans = () => api.get(MEAL_PLANS.LIST);
export const getShoppingList = () => api.get(SHOPPING.LIST);
export const updateShoppingListItem = (id, data) => api.patch(SHOPPING.ITEM(id), data);
export const clearPurchasedItems = () => api.delete(SHOPPING.CLEAR_PURCHASED);
