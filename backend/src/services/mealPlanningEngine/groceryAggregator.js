const normalizeName = (name) => {
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Ingredient name must be a non-empty string");
  }

  return name.trim().toLowerCase();
};

const normalizeUnit = (unit) => {
  if (typeof unit !== "string" || !unit.trim()) {
    throw new Error("Ingredient unit must be a non-empty string");
  }

  return unit.trim().toLowerCase();
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

export const aggregateIngredients = (ingredients) => {
  if (!Array.isArray(ingredients)) {
    throw new Error("Ingredients must be an array");
  }

  const aggregated = new Map();

  for (const ingredient of ingredients) {
    const name = normalizeName(ingredient.name);
    const unit = normalizeUnit(ingredient.unit);

    assertNonNegativeNumber(
      ingredient.quantity,
      "Ingredient quantity"
    );

    const key = `${name}::${unit}`;

    const existing = aggregated.get(key);

    if (existing) {
      existing.quantity += ingredient.quantity;
    } else {
      aggregated.set(key, {
        name: ingredient.name.trim(),
        unit,
        quantity: ingredient.quantity,
      });
    }
  }

  return Array.from(aggregated.values());
};

export const aggregatePantryShortages = (matches) => {
  if (!Array.isArray(matches)) {
    throw new Error("Pantry matches must be an array");
  }

  const shortages = matches
    .filter((match) => match.shortage > 0)
    .map((match) => ({
      name: match.name,
      unit: match.unit,
      quantity: match.shortage,
    }));

  return aggregateIngredients(shortages);
};

export const calculateGroceryTotalQuantity = (items) => {
  if (!Array.isArray(items)) {
    throw new Error("Grocery items must be an array");
  }

  return items.reduce(
    (total, item) => total + item.quantity,
    0
  );
};
