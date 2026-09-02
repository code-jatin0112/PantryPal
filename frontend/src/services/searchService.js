import api from './api';

// Comprehensive search index fixtures for immediate offline/hybrid global search
const GLOBAL_SEARCH_INDEX = [
  // Recipes
  {
    id: 'rec-1',
    category: 'recipes',
    title: 'Royal Butter Chicken (Murgh Makhani)',
    subtitle: 'Rich tomato, cream & spiced butter chicken curry',
    metadata: '40 mins • 4 servings • Medium',
    url: '/recipes/butter-chicken-demo',
    isFavorite: true,
  },
  {
    id: 'rec-2',
    category: 'recipes',
    title: 'Tuscan Garlic Herb Chicken Breast',
    subtitle: 'Seared chicken with wilted spinach and garlic cream',
    metadata: '25 mins • 3 servings • Easy',
    url: '/recipes/rec-1',
    isFavorite: true,
  },
  {
    id: 'rec-3',
    category: 'recipes',
    title: 'High-Protein Lemon Herb Quinoa Bowl',
    subtitle: 'Mediterranean grain bowl with roasted chickpeas & feta',
    metadata: '20 mins • 2 servings • Easy',
    url: '/recipes/rec-2',
    isFavorite: false,
  },
  {
    id: 'rec-4',
    category: 'recipes',
    title: 'Creamy Avocado Pesto Penne',
    subtitle: 'Plant-based silky avocado basil sauce with whole grain pasta',
    metadata: '15 mins • 2 servings • Easy',
    url: '/recipes/rec-4',
    isFavorite: false,
  },

  // Pantry Items
  {
    id: 'pan-1',
    category: 'pantry',
    title: 'Boneless Chicken Thighs',
    subtitle: 'Meat & Poultry container • 800g in stock',
    metadata: 'Fresh • Expiring in 4 days',
    url: '/pantry',
    isFavorite: false,
  },
  {
    id: 'pan-2',
    category: 'pantry',
    title: 'Extra Virgin Olive Oil',
    subtitle: 'Pantry Staples • 100ml remaining',
    metadata: 'Low Stock • Refill needed',
    url: '/pantry',
    isFavorite: false,
  },
  {
    id: 'pan-3',
    category: 'pantry',
    title: 'Whole Milk (Organic Valley)',
    subtitle: 'Dairy & Eggs container • 1 Carton',
    metadata: 'Expiring in 2 days',
    url: '/pantry',
    isFavorite: false,
  },
  {
    id: 'pan-4',
    category: 'pantry',
    title: 'Fresh Baby Spinach',
    subtitle: 'Produce container • 200g',
    metadata: 'Fresh • 85% full',
    url: '/pantry',
    isFavorite: false,
  },
  {
    id: 'pan-5',
    category: 'pantry',
    title: 'Organic Quinoa Grains',
    subtitle: 'Dry Goods • 500g',
    metadata: 'Shelf-stable • 12 months',
    url: '/pantry',
    isFavorite: false,
  },

  // Meal Plans
  {
    id: 'mp-1',
    category: 'meal_plans',
    title: 'Weekly High-Protein Mediterranean Plan',
    subtitle: '7-day balanced meal plan focusing on lean proteins & whole grains',
    metadata: '21 Meals • 2,100 kcal daily target',
    url: '/meal-plans',
    isFavorite: true,
  },
  {
    id: 'mp-2',
    category: 'meal_plans',
    title: 'Zero-Waste Pantry Cleanout Plan',
    subtitle: '3-day weekend plan utilizing items nearest to expiration date',
    metadata: '9 Meals • 94% Pantry stock match',
    url: '/meal-plans',
    isFavorite: false,
  },

  // Shopping Lists
  {
    id: 'shop-1',
    category: 'shopping',
    title: 'Weekly Grocery Essentials List',
    subtitle: '8 items pending purchase • Fresh produce & dairy',
    metadata: '$38.50 estimated total',
    url: '/shopping-list',
    isFavorite: false,
  },
  {
    id: 'shop-2',
    category: 'shopping',
    title: 'Specialty Indian Spices & Grains',
    subtitle: 'Kasuri methi, garam masala, and basmati rice',
    metadata: '3 items • High Priority',
    url: '/shopping-list',
    isFavorite: false,
  },

  // AI Recommendations & Studio
  {
    id: 'ai-1',
    category: 'ai',
    title: 'AI Recipe Engine: Tuscan Salmon (96% Match)',
    subtitle: 'Custom Gemini AI recommendation tailored to active spinach stock',
    metadata: '15 mins cook time • 36g protein',
    url: '/ai-recommendations',
    isFavorite: true,
  },
  {
    id: 'ai-2',
    category: 'ai',
    title: 'AI Kitchen Chat Assistant',
    subtitle: 'Ask questions regarding ingredient substitutions and cooking tips',
    metadata: 'Active AI Session',
    url: '/ai-chat',
    isFavorite: false,
  },

  // Cooking Sessions
  {
    id: 'cook-1',
    category: 'cooking',
    title: 'Cooking Mode: Royal Butter Chicken',
    subtitle: 'Step-by-step interactive cooking studio with live timer and checklists',
    metadata: '8 Steps • Step 1 ready',
    url: '/cooking/demo',
    isFavorite: false,
  },

  // Notifications
  {
    id: 'notif-1',
    category: 'notifications',
    title: 'Whole Milk Expiring Soon Warning',
    subtitle: 'Pantry best-by alert triggering in 2 days',
    metadata: 'High Priority Alert',
    url: '/notifications',
    isFavorite: false,
  },
  {
    id: 'notif-2',
    category: 'notifications',
    title: 'Olive Oil Low Stock Alert',
    subtitle: 'Inventory below 250ml safety threshold',
    metadata: 'Actionable Alert',
    url: '/notifications',
    isFavorite: false,
  },

  // Settings & System
  {
    id: 'set-1',
    category: 'settings',
    title: 'AI Culinary Intelligence Preferences',
    subtitle: 'Configure diets, allergies, health goals, and budget targets',
    metadata: 'Settings > AI Tuning',
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
    subtitle: 'Change password, update bio, or export full kitchen JSON archive',
    metadata: 'Profile & Security',
    url: '/profile',
    isFavorite: false,
  },
];

export const searchGlobal = async (query = '', filter = 'all') => {
  const q = query.toLowerCase().trim();

  // Short delay to simulate API search responsiveness
  await new Promise((r) => setTimeout(r, 120));

  if (!q && filter === 'all') {
    return [];
  }

  return GLOBAL_SEARCH_INDEX.filter((item) => {
    // Category filtering
    if (filter === 'favorites' && !item.isFavorite) return false;
    if (filter === 'recipes' && item.category !== 'recipes') return false;
    if (filter === 'pantry' && item.category !== 'pantry') return false;
    if (filter === 'shopping' && item.category !== 'shopping') return false;
    if (filter === 'meal_plans' && item.category !== 'meal_plans') return false;
    if (filter === 'ai' && item.category !== 'ai') return false;
    if (filter === 'notifications' && item.category !== 'notifications') return false;
    if (filter === 'settings' && item.category !== 'settings') return false;

    // Query text match
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
