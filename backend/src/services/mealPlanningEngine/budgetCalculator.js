const assertNonNegativeNumber = (value, fieldName) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
};

const normalizeUnit = (unit) => {
  if (typeof unit !== "string" || !unit.trim()) {
    throw new Error("Unit must be a non-empty string");
  }

  return unit.trim().toLowerCase();
};

const normalizePriceUnit = (priceUnit) => {
  if (priceUnit === undefined || priceUnit === null) {
    return null;
  }

  return normalizeUnit(priceUnit);
};

const UNIT_CONVERSIONS = {
  grams: {
    grams: 1,
    kg: 0.001,
  },
  kg: {
    grams: 1000,
    kg: 1,
  },
  ml: {
    ml: 1,
    liters: 0.001,
  },
  liters: {
    ml: 1000,
    liters: 1,
  },
  pieces: {
    pieces: 1,
  },
};

const convertQuantity = ({
  quantity,
  fromUnit,
  toUnit,
}) => {
  const normalizedFromUnit = normalizeUnit(fromUnit);
  const normalizedToUnit = normalizeUnit(toUnit);

  if (normalizedFromUnit === normalizedToUnit) {
    return quantity;
  }

  const conversionTable =
    UNIT_CONVERSIONS[normalizedFromUnit];

  if (!conversionTable) {
    throw new Error(
      `Unsupported quantity unit: ${normalizedFromUnit}`
    );
  }

  const conversionFactor =
    conversionTable[normalizedToUnit];

  if (conversionFactor === undefined) {
    throw new Error(
      `Cannot convert ${normalizedFromUnit} to ${normalizedToUnit}`
    );
  }

  return quantity * conversionFactor;
};

export const calculateIngredientCost = ({
  quantity,
  unit,
  pricePerUnit,
  priceUnit,
}) => {
  assertNonNegativeNumber(quantity, "Quantity");
  assertNonNegativeNumber(pricePerUnit, "Price per unit");

  if (priceUnit === undefined || priceUnit === null) {
    return quantity * pricePerUnit;
  }

  const convertedQuantity = convertQuantity({
    quantity,
    fromUnit: unit,
    toUnit: priceUnit,
  });

  return convertedQuantity * pricePerUnit;
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
      unit: ingredient.unit,
      pricePerUnit: ingredient.pricePerUnit,
      priceUnit: ingredient.priceUnit,
    });

    return {
      name: ingredient.name.trim(),
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      pricePerUnit: ingredient.pricePerUnit,
      ...(ingredient.priceUnit !== undefined && {
        priceUnit: ingredient.priceUnit,
      }),
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
