import api from './api';
import { MEAL_PLANS, SHOPPING, PANTRY, RECIPES, AI } from '../constants/api';

export const updateShoppingListItem = (id, data) => api.patch(SHOPPING.ITEM(id), data);

/**
 * Helper to determine an item's status relative to expiry and threshold
 */
const getItemStatus = (item) => {
  if (item.expiryDate) {
    const diffDays = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 3) return 'EXPIRING_SOON';
  }
  if (item.lowStockThreshold && item.quantity <= item.lowStockThreshold) {
    return 'LOW_STOCK';
  }
  return 'FRESH';
};

/**
 * Fetch dashboard summary counts strictly from real backend APIs
 */
export const getDashboardSummary = async () => {
  try {
    const [pantriesRes, recipesRes, shoppingRes, mealPlansRes] = await Promise.allSettled([
      api.get(PANTRY.LIST),
      api.get(RECIPES.LIST),
      api.get(SHOPPING.LIST),
      api.get(MEAL_PLANS.LIST),
    ]);

    let pantryItemsCount = 0;
    if (pantriesRes.status === 'fulfilled') {
      const pantries = pantriesRes.value.data?.data?.pantries || pantriesRes.value.data?.data || [];
      if (pantries.length > 0) {
        const primaryPantry = pantries[0];
        try {
          const itemsRes = await api.get(PANTRY.ITEMS(primaryPantry.id));
          const items = itemsRes.data?.data?.items || itemsRes.data?.data || [];
          pantryItemsCount = items.length;
        } catch {
          pantryItemsCount = 0;
        }
      }
    }

    const recipesCount =
      recipesRes.status === 'fulfilled'
        ? (recipesRes.value.data?.data?.recipes || recipesRes.value.data?.data || []).length
        : 0;

    const shoppingCount =
      shoppingRes.status === 'fulfilled'
        ? (shoppingRes.value.data?.data?.items || shoppingRes.value.data?.data || []).length
        : 0;

    const mealPlansCount =
      mealPlansRes.status === 'fulfilled'
        ? (mealPlansRes.value.data?.data?.mealPlans || mealPlansRes.value.data?.data || []).length
        : 0;

    return {
      success: true,
      data: {
        pantryItems: pantryItemsCount,
        recipes: recipesCount,
        shoppingList: shoppingCount,
        mealPlans: mealPlansCount,
      },
    };
  } catch (err) {
    return {
      success: true,
      data: {
        pantryItems: 0,
        recipes: 0,
        shoppingList: 0,
        mealPlans: 0,
      },
    };
  }
};

/**
 * Fetch pantry items for overview card from user's primary pantry
 */
export const getPantryOverview = async () => {
  try {
    const pantriesRes = await api.get(PANTRY.LIST);
    const pantries = pantriesRes.data?.data?.pantries || pantriesRes.data?.data || [];
    if (!pantries || pantries.length === 0) {
      return { success: true, data: [] };
    }

    const primaryPantry = pantries[0];
    const itemsRes = await api.get(PANTRY.ITEMS(primaryPantry.id));
    const rawItems = itemsRes.data?.data?.items || itemsRes.data?.data || [];

    const items = rawItems.slice(0, 6).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category || 'General',
      quantity: item.quantity,
      unit: item.unit || '',
      status: getItemStatus(item),
    }));

    return { success: true, data: items };
  } catch {
    return { success: true, data: [] };
  }
};

/**
 * Fetch expiring items strictly from backend pantry expiry query
 */
export const getExpiringItems = async () => {
  try {
    const pantriesRes = await api.get(PANTRY.LIST);
    const pantries = pantriesRes.data?.data?.pantries || pantriesRes.data?.data || [];
    if (!pantries || pantries.length === 0) {
      return { success: true, data: [] };
    }

    const primaryPantry = pantries[0];
    const expRes = await api.get(PANTRY.EXPIRING(primaryPantry.id, 7));
    const rawItems = expRes.data?.data?.items || expRes.data?.data || [];

    const items = rawItems.slice(0, 4).map((item) => {
      const diffDays = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        id: item.id,
        name: item.name,
        daysLeft: diffDays,
        label: diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays} days left`,
        variant: diffDays <= 1 ? 'danger' : 'warning',
      };
    });

    return { success: true, data: items };
  } catch {
    return { success: true, data: [] };
  }
};

/**
 * Fetch low stock items strictly from backend low stock query
 */
export const getLowStockItems = async () => {
  try {
    const pantriesRes = await api.get(PANTRY.LIST);
    const pantries = pantriesRes.data?.data?.pantries || pantriesRes.data?.data || [];
    if (!pantries || pantries.length === 0) {
      return { success: true, data: [] };
    }

    const primaryPantry = pantries[0];
    const lowRes = await api.get(PANTRY.LOW_STOCK(primaryPantry.id));
    const rawItems = lowRes.data?.data?.items || lowRes.data?.data || [];

    const items = rawItems.slice(0, 4).map((item) => {
      const threshold = item.lowStockThreshold || 1;
      const percent = Math.min(100, Math.max(5, Math.round((item.quantity / (threshold * 2)) * 100)));
      return {
        id: item.id,
        name: item.name,
        percent,
        currentQty: `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`,
        minQty: `${threshold}${item.unit ? ` ${item.unit}` : ''}`,
      };
    });

    return { success: true, data: items };
  } catch {
    return { success: true, data: [] };
  }
};

/**
 * Fetch today's meal plan preview from backend meal plans
 */
export const getMealPlan = async () => {
  try {
    const res = await api.get(MEAL_PLANS.LIST);
    const plans = res.data?.data?.mealPlans || res.data?.data || [];
    if (!plans || plans.length === 0) {
      return { success: true, data: [] };
    }

    const activePlan = plans[0];
    const dishes = activePlan.dishes || [];
    const today = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date().getDay()];
    const todayDishes = dishes.filter((d) => d.dayOfWeek === today || !d.dayOfWeek);

    const formatted = (todayDishes.length > 0 ? todayDishes : dishes).slice(0, 4).map((d) => ({
      id: d.id,
      type: d.mealType || 'Meal',
      recipeName: d.recipe?.title || d.recipeName || 'Custom Dish',
      time: d.mealType === 'BREAKFAST' ? '8:00 AM' : d.mealType === 'LUNCH' ? '1:00 PM' : '7:30 PM',
      calories: d.recipe?.nutrition?.calories ? `${d.recipe.nutrition.calories} kcal` : '450 kcal',
    }));

    return { success: true, data: formatted };
  } catch {
    return { success: true, data: [] };
  }
};

/**
 * Fetch shopping list preview items from backend
 */
export const getShoppingPreview = async () => {
  try {
    const res = await api.get(SHOPPING.LIST);
    const rawItems = res.data?.data?.items || res.data?.data || [];
    const items = rawItems.slice(0, 5).map((item) => ({
      id: item.id,
      name: item.name,
      isPurchased: !!item.isPurchased,
      quantity: item.quantity,
      unit: item.unit || '',
    }));
    return { success: true, data: items };
  } catch {
    return { success: true, data: [] };
  }
};

/**
 * Fetch personalized AI recommendations strictly from backend
 */
export const getAIRecommendations = async () => {
  try {
    const res = await api.post(AI.RECOMMENDATIONS, { limit: 3 });
    const recs = res.data?.data?.recommendations || res.data?.data || [];
    const items = recs.slice(0, 3).map((r) => ({
      id: r.id || r.recipeId,
      name: r.recipe?.title || r.title || r.name,
      description: r.recipe?.description || r.description || r.reason || 'Personalized match based on your kitchen inventory',
    }));
    return { success: true, data: items };
  } catch {
    return { success: true, data: [] };
  }
};
