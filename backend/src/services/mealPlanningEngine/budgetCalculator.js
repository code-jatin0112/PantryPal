const assertNonNegativeNumber = (value, fieldName) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
};

export const calculateIngredientCost = ({
  quantity,
  pricePerUnit,
}) => {
  assertNonNegativeNumber(quantity, "Quantity");
  assertNonNegativeNumber(pricePerUnit, "Price per unit");

  return quantity * pricePerUnit;
};

export const calculateBudget = ({
  ingredients,
  budget,
}) => {
  if (!Array.isArray(ingredients)) {
    throw new Error("Ingredients must be an array");
  }

  if (budget !== undefined && budget !== null) {
    assertNonNegativeNumber(budget, "Budget");
  }

  const items = ingredients.map((ingredient) => {
    if (
      typeof ingredient.name !== "string" ||
      !ingredient.name.trim()
    ) {
      throw new Error(
        "Ingredient name must be a non-empty string"
      );
    }

    const cost = calculateIngredientCost({
      quantity: ingredient.quantity,
      pricePerUnit: ingredient.pricePerUnit,
    });

    return {
      name: ingredient.name.trim(),
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      pricePerUnit: ingredient.pricePerUnit,
      estimatedCost: cost,
    };
  });

  const totalEstimatedCost = items.reduce(
    (total, item) => total + item.estimatedCost,
    0
  );

  if (budget === undefined || budget === null) {
    return {
      items,
      totalEstimatedCost,
      budget: null,
      remainingBudget: null,
      exceededBy: 0,
      withinBudget: null,
    };
  }

  const remainingBudget = Math.max(
    budget - totalEstimatedCost,
    0
  );

  const exceededBy = Math.max(
    totalEstimatedCost - budget,
    0
  );

  return {
    items,
    totalEstimatedCost,
    budget,
    remainingBudget,
    exceededBy,
    withinBudget: totalEstimatedCost <= budget,
  };
};
