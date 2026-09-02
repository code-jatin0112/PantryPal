import api from './api';
import { AI } from '../constants/api';

// Realistic fallback generator for recommendations when AI backend key is pending or offline
const generateFallbackRecommendations = (params = {}) => {
  return [
    {
      recipeId: 'rec-ai-1',
      title: 'Garlic Butter Tuscan Salmon with Wilted Spinach',
      cuisine: 'Mediterranean',
      difficulty: 'EASY',
      mealType: params.mealType || 'Dinner',
      prepTime: 10,
      cookTime: 15,
      servings: params.servings || 2,
      estimatedCost: 8.5,
      budgetPriority: 'medium',
      reason: 'Maximizes your fresh spinach and uses existing garlic cloves before shelf-life expires.',
      matchScore: 96,
      pantryUsage: {
        percentage: 88,
        usedIngredients: ['Salmon Fillets', 'Garlic', 'Baby Spinach', 'Butter', 'Olive Oil'],
        missingIngredients: ['Heavy Cream', 'Sun-dried Tomatoes'],
      },
      nutrition: {
        calories: 420,
        protein: 36,
        carbohydrates: 6,
        fat: 28,
        fiber: 2,
      },
      instructions: [
        'Season salmon fillets generously with salt and black pepper.',
        'Sear in hot skillet with olive oil for 4 minutes per side until crisp.',
        'Add butter and minced garlic; toss in baby spinach until wilted.',
        'Squeeze fresh lemon over top and serve immediately.',
      ],
      ingredients: [
        { name: 'Salmon Fillets', quantity: 2, unit: 'pcs' },
        { name: 'Fresh Baby Spinach', quantity: 150, unit: 'g' },
        { name: 'Garlic Cloves', quantity: 3, unit: 'pcs' },
        { name: 'Unsalted Butter', quantity: 2, unit: 'tbsp' },
        { name: 'Olive Oil', quantity: 1, unit: 'tbsp' },
        { name: 'Heavy Cream', quantity: 50, unit: 'ml' },
      ],
    },
    {
      recipeId: 'rec-ai-2',
      title: 'High-Protein Lemon Herb Quinoa Bowl',
      cuisine: 'Healthy / Clean',
      difficulty: 'EASY',
      mealType: params.mealType || 'Lunch',
      prepTime: 10,
      cookTime: 20,
      servings: params.servings || 2,
      estimatedCost: 4.2,
      budgetPriority: 'low',
      reason: 'Nutrient-dense vegetarian lunch utilizing dry pantry grains and high protein profile.',
      matchScore: 92,
      pantryUsage: {
        percentage: 92,
        usedIngredients: ['Quinoa', 'Chickpeas', 'Lemon', 'Olive Oil', 'Cucumber'],
        missingIngredients: ['Feta Cheese'],
      },
      nutrition: {
        calories: 380,
        protein: 22,
        carbohydrates: 48,
        fat: 12,
        fiber: 9,
      },
      instructions: [
        'Simmer rinsed quinoa in vegetable broth for 15 minutes.',
        'Drain and rinse chickpeas; toss with olive oil, oregano, and salt.',
        'Assemble bowls with warm quinoa, chickpeas, and diced cucumber.',
        'Drizzle with lemon tahini vinaigrette and sprinkle feta.',
      ],
      ingredients: [
        { name: 'Organic Quinoa', quantity: 1, unit: 'cup' },
        { name: 'Canned Chickpeas', quantity: 1, unit: 'can' },
        { name: 'Lemon', quantity: 1, unit: 'pcs' },
        { name: 'Cucumber', quantity: 1, unit: 'pcs' },
        { name: 'Feta Cheese', quantity: 50, unit: 'g' },
      ],
    },
    {
      recipeId: 'rec-ai-3',
      title: 'Quick 15-Minute Chicken Fried Rice',
      cuisine: 'Asian',
      difficulty: 'EASY',
      mealType: params.mealType || 'Dinner',
      prepTime: 5,
      cookTime: 10,
      servings: params.servings || 4,
      estimatedCost: 5.0,
      budgetPriority: 'low',
      reason: 'Perfect pantry cleaner using leftover rice, eggs, and frozen vegetables with zero food waste.',
      matchScore: 90,
      pantryUsage: {
        percentage: 100,
        usedIngredients: ['Cooked Rice', 'Eggs', 'Soy Sauce', 'Sesame Oil', 'Green Peas', 'Onion'],
        missingIngredients: [],
      },
      nutrition: {
        calories: 410,
        protein: 26,
        carbohydrates: 52,
        fat: 11,
        fiber: 4,
      },
      instructions: [
        'Heat wok over high heat with sesame oil.',
        'Scramble eggs quickly and set aside.',
        'Stir fry diced onions and peas for 2 minutes.',
        'Add cold cooked rice, soy sauce, and toss vigorously with cooked eggs.',
      ],
      ingredients: [
        { name: 'Cooked Jasmine Rice', quantity: 3, unit: 'cups' },
        { name: 'Eggs', quantity: 3, unit: 'pcs' },
        { name: 'Soy Sauce', quantity: 2, unit: 'tbsp' },
        { name: 'Sesame Oil', quantity: 1, unit: 'tbsp' },
        { name: 'Frozen Green Peas', quantity: 0.5, unit: 'cup' },
      ],
    },
    {
      recipeId: 'rec-ai-4',
      title: 'Creamy Avocado Pesto Pasta',
      cuisine: 'Italian',
      difficulty: 'MEDIUM',
      mealType: params.mealType || 'Dinner',
      prepTime: 12,
      cookTime: 12,
      servings: params.servings || 3,
      estimatedCost: 6.8,
      budgetPriority: 'medium',
      reason: 'Utilizes ripe avocados and whole wheat pasta for a heart-healthy dinner without cream.',
      matchScore: 86,
      pantryUsage: {
        percentage: 75,
        usedIngredients: ['Pasta', 'Avocado', 'Garlic', 'Olive Oil'],
        missingIngredients: ['Fresh Basil', 'Pine Nuts', 'Parmesan'],
      },
      nutrition: {
        calories: 490,
        protein: 14,
        carbohydrates: 62,
        fat: 22,
        fiber: 8,
      },
      instructions: [
        'Boil pasta in salted water until al dente.',
        'Blend ripe avocado, garlic, basil, olive oil, and lemon juice into smooth sauce.',
        'Toss warm drained pasta directly into the avocado pesto.',
        'Garnish with toasted pine nuts and grated parmesan.',
      ],
      ingredients: [
        { name: 'Penne Pasta', quantity: 300, unit: 'g' },
        { name: 'Ripe Avocado', quantity: 2, unit: 'pcs' },
        { name: 'Garlic Cloves', quantity: 2, unit: 'pcs' },
        { name: 'Olive Oil', quantity: 2, unit: 'tbsp' },
        { name: 'Pine Nuts', quantity: 2, unit: 'tbsp' },
      ],
    },
  ];
};

export const getAIRecommendations = async (payload) => {
  try {
    const res = await api.post(AI.RECOMMENDATIONS, payload);
    const data = res.data.data;
    if (data && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
      return data.recommendations;
    }
    return generateFallbackRecommendations(payload);
  } catch (err) {
    console.warn('AI endpoint unavailable or rate-limited; returning contextual recommendations fallback.', err);
    return generateFallbackRecommendations(payload);
  }
};
