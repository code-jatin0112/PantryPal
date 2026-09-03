/**
 * API Endpoint Constants
 * All backend endpoints are defined here — never hardcoded in service files.
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// ── Auth ──────────────────────────────────────────────────
export const AUTH = {
  LOGIN:    '/auth/login',
  REGISTER: '/auth/register',
  ME:       '/auth/me',
};

// ── Pantry ────────────────────────────────────────────────
export const PANTRY = {
  LIST:            '/pantries',
  CREATE:          '/pantries',
  DELETE:          (id) => `/pantries/${id}`,

  // Items
  ITEMS:           (pantryId) => `/pantries/${pantryId}/items`,
  ITEM:            (pantryId, itemId) => `/pantries/${pantryId}/items/${itemId}`,
  ITEM_ADJUST:     (pantryId, itemId) => `/pantries/${pantryId}/items/${itemId}/adjust`,

  // Alerts
  EXPIRING:        (pantryId, days = 7) => `/pantries/${pantryId}/expiring?days=${days}`,
  EXPIRED:         (pantryId) => `/pantries/${pantryId}/expired`,
  LOW_STOCK:       (pantryId) => `/pantries/${pantryId}/low-stock`,
};

// ── Recipes ───────────────────────────────────────────────
export const RECIPES = {
  LIST:            '/recipes',
  CREATE:          '/recipes',
  DETAIL:          (id) => `/recipes/${id}`,
  UPDATE:          (id) => `/recipes/${id}`,
  DELETE:          (id) => `/recipes/${id}`,
  CONSUME:         (id) => `/recipes/${id}/consume`,

  // Favorites
  FAVORITES:       '/recipes/favorites',
  FAVORITE:        (id) => `/recipes/${id}/favorite`,
  FAVORITE_STATUS: (id) => `/recipes/${id}/favorite/status`,

  // Pantry matching
  PANTRY_MATCH:    (recipeId, pantryId) => `/recipes/${recipeId}/pantries/${pantryId}/availability`,

  // Ingredients
  INGREDIENTS:     (recipeId) => `/recipes/${recipeId}/ingredients`,

  // Scaling
  SCALE:           (recipeId, servings) => `/recipes/${recipeId}/scale?servings=${servings}`,

  // Nutrition
  NUTRITION:       (recipeId) => `/recipes/${recipeId}/nutrition`,
};

// ── Shopping List ─────────────────────────────────────────
export const SHOPPING = {
  LIST:       '/shopping-list',
  CREATE:     '/shopping-list',
  ITEM:       (id) => `/shopping-list/${id}`,
  CLEAR_PURCHASED: '/shopping-list/purchased',
};

// ── Meal Plans ────────────────────────────────────────────
export const MEAL_PLANS = {
  LIST:       '/meal-plans',
  CREATE:     '/meal-plans',
  DETAIL:     (id) => `/meal-plans/${id}`,
  UPDATE:     (id) => `/meal-plans/${id}`,
  DELETE:     (id) => `/meal-plans/${id}`,

  // Dishes
  DISHES:     (mealPlanId) => `/meal-plans/${mealPlanId}/dishes`,
  DISH:       (mealPlanId, dishId) => `/meal-plans/${mealPlanId}/dishes/${dishId}`,

  // Evaluation
  EVALUATE:   (mealPlanId) => `/meal-plans/${mealPlanId}/evaluate`,
  GROCERY:    (mealPlanId) => `/meal-plans/${mealPlanId}/grocery-requirements`,
};

// ── Cooking Sessions ──────────────────────────────────────
export const COOKING = {
  START:      (recipeId) => `/recipes/${recipeId}/cooking-sessions`,
  ACTIVE:     (recipeId) => `/recipes/${recipeId}/cooking-sessions/active`,
  COMPLETE:   (recipeId, sessionId) => `/recipes/${recipeId}/cooking-sessions/${sessionId}/complete`,
};

// ── AI ────────────────────────────────────────────────────
export const AI = {
  CHAT:            '/ai/chat',
  GENERATE_RECIPE: '/ai/recipes/generate',
  RECOMMENDATIONS: '/ai/recommendations',
};

// ── User Preferences ──────────────────────────────────────
export const PREFERENCES = {
  GET:    '/preferences',
  UPDATE: '/preferences',
};

// ── App Constants ─────────────────────────────────────────
export const PANTRY_CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Seafood',
  'Grains', 'Spices', 'Beverages', 'Snacks',
  'Frozen', 'Canned', 'Other',
];

export const PANTRY_UNITS = [
  'kg', 'g', 'lbs', 'oz',
  'L', 'ml', 'cups',
  'pieces', 'units', 'tbsp', 'tsp',
];

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch',     label: 'Lunch' },
  { value: 'dinner',    label: 'Dinner' },
  { value: 'snack',     label: 'Snack' },
  { value: 'other',     label: 'Other' },
];

export const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Paleo', 'Nut-Free', 'Halal', 'Kosher',
];

export const CUISINE_OPTIONS = [
  'Italian', 'Indian', 'Chinese', 'Japanese', 'Mexican',
  'Mediterranean', 'French', 'Thai', 'American', 'Other',
];
