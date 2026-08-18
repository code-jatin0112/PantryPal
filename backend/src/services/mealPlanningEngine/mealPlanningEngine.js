import { scaleIngredients } from "./servingCalculator.js";
import {
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

const normalizeText = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return value.trim().toLowerCase();
};

const assertNonNegativeNumber = (value, fieldName) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
};

const clonePantryItems = (pantryItems) => {
  if (!Array.isArray(pantryItems)) {
    throw new Error("Pantry items must be an array");
  }

  return pantryItems.map((item) => {
    normalizeText(item.name, "Pantry item name");
    normalizeText(item.unit, "Pantry item unit");
    assertNonNegativeNumber(
      item.quantity,
      "Pantry item quantity"
    );

    return {
      ...item,
      quantity: item.quantity,
    };
  });
};

const consumePantryIngredient = ({
  ingredient,
  remainingPantryItems,
}) => {
  const ingredientName = normalizeText(
    ingredient.name,
    "Ingredient name"
  );
  const ingredientUnit = normalizeText(
    ingredient.unit,
    "Ingredient unit"
  );

  assertNonNegativeNumber(
    ingredient.quantity,
    "Required quantity"
  );

  const pantryItem = remainingPantryItems.find(
    (item) =>
      normalizeText(item.name, "Pantry item name") ===
        ingredientName &&
      normalizeText(item.unit, "Pantry item unit") ===
        ingredientUnit
  );

  const availableQuantity = pantryItem
    ? pantryItem.quantity
    : 0;

  const usedQuantity = Math.min(
    ingredient.quantity,
    availableQuantity
  );

  const shortage = ingredient.quantity - usedQuantity;

  if (pantryItem) {
    pantryItem.quantity -= usedQuantity;
  }

  return {
    name: ingredient.name,
    unit: ingredient.unit,
    requiredQuantity: ingredient.quantity,
    availableQuantity,
    shortage,
    status:
      availableQuantity === 0
        ? "missing"
        : shortage > 0
          ? "shortage"
          : "available",
  };
};

const getServingCoverage = ({
  peopleCount,
  requestedServings,
}) => {
  if (
    typeof peopleCount !== "number" ||
    !Number.isFinite(peopleCount) ||
    peopleCount <= 0
  ) {
    throw new Error(
      "People count must be a positive number"
    );
  }

  const ratio = requestedServings / peopleCount;

  if (ratio < 0.5) {
    return {
      servingCoverage: "critical",
      shortageRisk: true,
      potentialWaste: false,
    };
  }

  if (ratio < 0.8) {
    return {
      servingCoverage: "warning",
      shortageRisk: true,
      potentialWaste: false,
    };
  }

  if (ratio <= 1.2) {
    return {
      servingCoverage: "balanced",
      shortageRisk: false,
      potentialWaste: false,
    };
  }

  if (ratio <= 1.5) {
    return {
      servingCoverage: "warning",
      shortageRisk: false,
      potentialWaste: true,
    };
  }

  return {
    servingCoverage: "critical",
    shortageRisk: false,
    potentialWaste: true,
  };
};

const buildBudgetAnalysis = ({
  groceryItems,
  allIngredients,
  budget,
}) => {
  const pricedIngredients = groceryItems.map((item) => {
    const sourceIngredient = allIngredients.find(
      (ingredient) =>
        normalizeText(ingredient.name, "Ingredient name") ===
          normalizeText(item.name, "Grocery item name") &&
        normalizeText(ingredient.unit, "Ingredient unit") ===
          normalizeText(item.unit, "Grocery item unit")
    );

    return {
      ...item,
      pricePerUnit: sourceIngredient?.pricePerUnit,
      priceUnit: sourceIngredient?.priceUnit,
    };
  });

  const pricingAvailable = pricedIngredients.every(
    (item) =>
      typeof item.pricePerUnit === "number" &&
      Number.isFinite(item.pricePerUnit) &&
      item.pricePerUnit >= 0
  );

  if (!pricingAvailable) {
    return {
      items: pricedIngredients.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        estimatedCost: null,
      })),
      totalEstimatedCost: null,
      budget: budget ?? null,
      remainingBudget: null,
      exceededBy: null,
      withinBudget: null,
      pricingAvailable: false,
    };
  }

  return {
    ...calculateBudget({
      ingredients: pricedIngredients,
      budget,
    }),
    pricingAvailable: true,
  };
};

const buildNutritionAnalysis = (dishes) => {
  const nutritionAvailable = dishes.every(
    (dish) => dish.nutritionPerServing
  );

  if (!nutritionAvailable) {
    return {
      available: false,
      approximate: true,
      totals: null,
      dishes: [],
    };
  }

  return {
    available: true,
    approximate: true,
    ...calculateMealPlanNutrition(
      dishes.map((dish) => ({
        recipeId: dish.recipeId,
        requestedServings: dish.requestedServings,
        nutritionPerServing: dish.nutritionPerServing,
      }))
    ),
  };
};

export const generateMealPlanAnalysis = ({
  dishes,
  pantryItems = [],
  budget,
  peopleCount,
}) => {
  if (!Array.isArray(dishes) || dishes.length === 0) {
    throw new Error("At least one dish is required");
  }

  const remainingPantryItems = clonePantryItems(pantryItems);

  const analyzedDishes = dishes.map((dish) => {
    if (!dish || typeof dish !== "object") {
      throw new Error("Each dish must be an object");
    }

    if (!Array.isArray(dish.ingredients)) {
      throw new Error(
        `Ingredients must be an array for recipe ${dish.recipeId}`
      );
    }

    const scaled = scaleIngredients({
      ingredients: dish.ingredients,
      baseServings: dish.baseServings,
      requestedServings: dish.requestedServings,
    });

    const pantryMatches = scaled.ingredients.map((ingredient) =>
      consumePantryIngredient({
        ingredient,
        remainingPantryItems,
      })
    );

    const missingIngredients = pantryMatches
      .filter((match) => match.shortage > 0)
      .map((match) => ({
        name: match.name,
        quantity: match.shortage,
        unit: match.unit,
      }));

    return {
      dishId: dish.dishId,
      recipeId: dish.recipeId,
      requestedServings: dish.requestedServings,
      scalingFactor: scaled.scalingFactor,
      ingredients: scaled.ingredients,
      pantry: {
        matches: pantryMatches,
        coverage: calculatePantryCoverage(pantryMatches),
      },
      missingIngredients,
      estimatedAdditionalCost: null,
      budgetCompatible: null,
      ...getServingCoverage({
        peopleCount,
        requestedServings: dish.requestedServings,
      }),
      nutritionPerServing: dish.nutritionPerServing ?? null,
    };
  });

  const allMatches = analyzedDishes.flatMap((dish) =>
    dish.pantry.matches.map((match) => ({
      dishId: dish.dishId,
      ...match,
    }))
  );

  const allIngredients = analyzedDishes.flatMap(
    (dish) => dish.ingredients
  );

  const groceryItems = aggregatePantryShortages(allMatches);

  const budgetAnalysis = buildBudgetAnalysis({
    groceryItems,
    allIngredients,
    budget,
  });

  return {
    dishes: analyzedDishes,
    pantry: {
      matches: allMatches,
      coverage: calculatePantryCoverage(allMatches),
    },
    grocery: {
      items: groceryItems,
    },
    budget: budgetAnalysis,
    nutrition: buildNutritionAnalysis(analyzedDishes),
  };
};