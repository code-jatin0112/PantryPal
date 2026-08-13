import { scaleIngredients } from "./servingCalculator.js";
import {
  matchPantry,
  calculatePantryCoverage,
} from "./pantryMatcher.js";
import {
  aggregatePantryShortages,
} from "./groceryAggregator.js";
import {
  calculateBudget,
} from "./budgetCalculator.js";
import {
  calculateMealPlanNutrition,
} from "./nutritionCalculator.js";

export const generateMealPlanAnalysis = ({
  dishes,
  pantryItems = [],
  budget,
}) => {
  if (!Array.isArray(dishes) || dishes.length === 0) {
    throw new Error("At least one dish is required");
  }

  const scaledDishes = dishes.map((dish) => {
    if (!dish || typeof dish !== "object") {
      throw new Error("Each dish must be an object");
    }

    if (!Array.isArray(dish.ingredients)) {
      throw new Error(
        `Ingredients must be an array for recipe ${dish.recipeId}`
      );
    }

    const baseServings = dish.baseServings;

    const scaled = scaleIngredients({
      ingredients: dish.ingredients,
      baseServings,
      requestedServings: dish.requestedServings,
    });

    return {
      recipeId: dish.recipeId,
      requestedServings: dish.requestedServings,
      scalingFactor: scaled.scalingFactor,
      ingredients: scaled.ingredients,
      nutritionPerServing: dish.nutritionPerServing,
    };
  });

  const allIngredients = scaledDishes.flatMap(
    (dish) => dish.ingredients
  );

  const pantryMatches = matchPantry({
    ingredients: allIngredients,
    pantryItems,
  });

  const pantryCoverage =
    calculatePantryCoverage(pantryMatches);

  const groceryItems =
    aggregatePantryShortages(pantryMatches);

  const budgetIngredients = groceryItems.map((item) => {
    const source = allIngredients.find(
      (ingredient) =>
        ingredient.name.trim().toLowerCase() ===
          item.name.trim().toLowerCase() &&
        ingredient.unit.trim().toLowerCase() ===
          item.unit.trim().toLowerCase()
    );

    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: source?.pricePerUnit ?? 0,
      ...(source?.priceUnit !== undefined && {
        priceUnit: source.priceUnit,
      }),
    };
  });

  const budgetAnalysis = calculateBudget({
    budget,
    ingredients: budgetIngredients,
  });

  const nutrition = calculateMealPlanNutrition(
    scaledDishes.map((dish) => ({
      recipeId: dish.recipeId,
      requestedServings: dish.requestedServings,
      nutritionPerServing: dish.nutritionPerServing,
    }))
  );

  return {
    dishes: scaledDishes,
    pantry: {
      matches: pantryMatches,
      coverage: pantryCoverage,
    },
    grocery: {
      items: groceryItems,
    },
    budget: budgetAnalysis,
    nutrition,
  };
};
