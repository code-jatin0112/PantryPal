const NUTRIENT_FIELDS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
];

const assertNonNegativeNumber = (value, fieldName) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
};

const validateNutrition = (nutrition) => {
  if (!nutrition || typeof nutrition !== "object") {
    throw new Error("Nutrition data must be an object");
  }

  for (const field of NUTRIENT_FIELDS) {
    if (nutrition[field] !== undefined) {
      assertNonNegativeNumber(
        nutrition[field],
        `Nutrition ${field}`
      );
    }
  }
};

export const calculateDishNutrition = ({
  nutritionPerServing,
  requestedServings,
}) => {
  validateNutrition(nutritionPerServing);

  assertNonNegativeNumber(
    requestedServings,
    "Requested servings"
  );

  if (requestedServings === 0) {
    throw new Error("Requested servings must be greater than zero");
  }

  const result = {};

  for (const field of NUTRIENT_FIELDS) {
    const value = nutritionPerServing[field] ?? 0;

    result[field] = value * requestedServings;
  }

  return result;
};

export const calculateMealPlanNutrition = (dishes) => {
  if (!Array.isArray(dishes)) {
    throw new Error("Dishes must be an array");
  }

  const totals = Object.fromEntries(
    NUTRIENT_FIELDS.map((field) => [field, 0])
  );

  const dishNutrition = dishes.map((dish) => {
    if (!dish || typeof dish !== "object") {
      throw new Error("Each dish must be an object");
    }

    const nutrition = calculateDishNutrition({
      nutritionPerServing: dish.nutritionPerServing,
      requestedServings: dish.requestedServings,
    });

    for (const field of NUTRIENT_FIELDS) {
      totals[field] += nutrition[field];
    }

    return {
      recipeId: dish.recipeId,
      nutrition,
    };
  });

  return {
    totals,
    dishes: dishNutrition,
  };
};
