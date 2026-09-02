import api from './api';
import { RECIPES, PANTRY, MEAL_PLANS, SHOPPING } from '../constants/api';

const FALLBACK_SYSTEM_RESULTS = [
  {
    id: 'ai-1',
    category: 'ai',
    title: 'AI Recipe Recommendations',
    subtitle: 'Personalized recipes matched to pantry inventory',
    metadata: 'AI Intelligence',
    url: '/ai-recommendations',
    isFavorite: false,
  },
  {
    id: 'ai-2',
    category: 'ai',
    title: 'AI Kitchen Chat Assistant',
    subtitle: 'Ask culinary questions and get instant ingredient substitutions',
    metadata: 'AI Studio',
    url: '/ai-chat',
    isFavorite: false,
  },
  {
    id: 'set-1',
    category: 'settings',
    title: 'AI Culinary Preferences Tuning',
    subtitle: 'Configure diets, allergies, health goals, and budget targets',
    metadata: 'Settings > AI',
    url: '/settings',
    isFavorite: false,
  },
  {
    id: 'set-2',
    category: 'settings',
    title: 'Measurement Units & Regional Formats',
    subtitle: 'Switch between Metric (g/ml) and Imperial (oz/cups)',
    metadata: 'Settings > General',
    url: '/settings',
    isFavorite: false,
  },
  {
    id: 'set-3',
    category: 'settings',
    title: 'Chef Profile & Account Security',
    subtitle: 'Update profile details or change account password',
    metadata: 'Profile & Security',
    url: '/profile',
    isFavorite: false,
  },
];

/**
 * Unified multi-entity search across backend recipes, pantry inventory, meal plans, and shopping list
 */
export const searchGlobal = async (query = '', filter = 'all', pantryId = null) => {
  const q = query.toLowerCase().trim();

  // 1. Fetch live entities from backend in parallel
  const liveResults = [];

  try {
    const promises = [
      api.get(RECIPES.LIST).catch(() => ({ data: { data: [] } })),
      api.get(MEAL_PLANS.LIST).catch(() => ({ data: { data: [] } })),
      api.get(SHOPPING.LIST).catch(() => ({ data: { data: [] } })),
    ];

    let targetPantryId = pantryId;
    if (!targetPantryId) {
      try {
        const pantriesRes = await api.get(PANTRY.LIST);
        const pantries = pantriesRes.data?.data?.pantries || pantriesRes.data?.data || [];
        if (pantries.length > 0) {
          targetPantryId = pantries[0].id;
        }
      } catch {}
    }

    if (targetPantryId) {
      promises.push(
        api.get(PANTRY.ITEMS(targetPantryId)).catch(() => ({ data: { data: [] } }))
      );
    }

    const [recipesRes, mealPlansRes, shoppingRes, pantryRes] = await Promise.allSettled(promises);

    // Map Recipes
    if (recipesRes.status === 'fulfilled') {
      const recipes = recipesRes.value.data?.data?.recipes || recipesRes.value.data?.data || [];
      recipes.forEach((r) => {
        liveResults.push({
          id: `rec-${r.id}`,
          category: 'recipes',
          title: r.title || r.name,
          subtitle: r.description || `Cuisine: ${r.cuisine || 'General'}`,
          metadata: `${(r.prepTime || 0) + (r.cookTime || 0)} mins • ${r.servings || 4} servings`,
          url: `/recipes/${r.id}`,
          isFavorite: Boolean(r.isFavorite),
        });
      });
    }

    // Map Meal Plans
    if (mealPlansRes.status === 'fulfilled') {
      const plans = mealPlansRes.value.data?.data?.mealPlans || mealPlansRes.value.data?.data || [];
      plans.forEach((mp) => {
        liveResults.push({
          id: `mp-${mp.id}`,
          category: 'meal_plans',
          title: mp.name || mp.title || 'Weekly Meal Plan',
          subtitle: mp.description || 'Structured weekly dining schedule',
          metadata: `${mp.dishes?.length || 0} meals planned`,
          url: `/meal-plans/${mp.id}`,
          isFavorite: false,
        });
      });
    }

    // Map Shopping Lists
    if (shoppingRes.status === 'fulfilled') {
      const shopItems = shoppingRes.value.data?.data?.items || shoppingRes.value.data?.data || [];
      shopItems.forEach((item) => {
        liveResults.push({
          id: `shop-${item.id}`,
          category: 'shopping',
          title: item.name || item.ingredientName,
          subtitle: `Quantity: ${item.quantity || 1} ${item.unit || ''}`,
          metadata: item.isPurchased ? 'Purchased' : 'Pending Purchase',
          url: '/shopping-list',
          isFavorite: false,
        });
      });
    }

    // Map Pantry Items
    if (pantryRes && pantryRes.status === 'fulfilled') {
      const pantryItems = pantryRes.value.data?.data?.items || pantryRes.value.data?.data || [];
      pantryItems.forEach((item) => {
        liveResults.push({
          id: `pan-${item.id}`,
          category: 'pantry',
          title: item.name,
          subtitle: `Stock: ${item.quantity} ${item.unit || ''} • Category: ${item.category || 'General'}`,
          metadata: item.expiryDate ? `Expires: ${new Date(item.expiryDate).toLocaleDateString()}` : 'In Stock',
          url: '/pantry',
          isFavorite: false,
        });
      });
    }
  } catch (err) {
    console.warn('Backend search aggregation partially failed; supplementing with index.', err);
  }

  // Combine live results with static system routes
  const combined = [...liveResults, ...FALLBACK_SYSTEM_RESULTS];

  // If no query and filter is all, return empty
  if (!q && filter === 'all') {
    return [];
  }

  // Filter combined results
  return combined.filter((item) => {
    if (filter === 'favorites' && !item.isFavorite) return false;
    if (filter === 'recipes' && item.category !== 'recipes') return false;
    if (filter === 'pantry' && item.category !== 'pantry') return false;
    if (filter === 'shopping' && item.category !== 'shopping') return false;
    if (filter === 'meal_plans' && item.category !== 'meal_plans') return false;
    if (filter === 'ai' && item.category !== 'ai') return false;
    if (filter === 'settings' && item.category !== 'settings') return false;

    if (q) {
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchSubtitle = (item.subtitle || '').toLowerCase().includes(q);
      const matchMeta = (item.metadata || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchMeta || matchCat;
    }

    return true;
  });
};
