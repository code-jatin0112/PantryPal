const assertPositiveNumber = (value, fieldName) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(`${fieldName} must be a positive number`);
  }
};

export const calculateScalingFactor = (
  baseServings,
  requestedServings
) => {
  assertPositiveNumber(baseServings, "Base servings");
  assertPositiveNumber(requestedServings, "Requested servings");

  return requestedServings / baseServings;
};

export const scaleQuantity = (quantity, scalingFactor) => {
  assertPositiveNumber(quantity, "Quantity");
  assertPositiveNumber(scalingFactor, "Scaling factor");

  return quantity * scalingFactor;
};

export const scaleIngredients = ({
  ingredients,
  baseServings,
  requestedServings,
}) => {
  if (!Array.isArray(ingredients)) {
    throw new Error("Ingredients must be an array");
  }

  const scalingFactor = calculateScalingFactor(
    baseServings,
    requestedServings
  );

  return {
    scalingFactor,
    ingredients: ingredients.map((ingredient) => ({
      ...ingredient,
      quantity: scaleQuantity(
        ingredient.quantity,
        scalingFactor
      ),
    })),
  };
};
