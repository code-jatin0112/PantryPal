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

const normalizePantry = (pantryItems) => {
  if (!Array.isArray(pantryItems)) {
    throw new Error("Pantry items must be an array");
  }

  const pantryMap = new Map();

  for (const item of pantryItems) {
    const name = normalizeName(item.name);
    const unit = normalizeUnit(item.unit);

    assertNonNegativeNumber(
      item.quantity,
      "Pantry quantity"
    );

    const key = `${name}::${unit}`;

    const existing = pantryMap.get(key);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      pantryMap.set(key, {
        name: item.name.trim(),
        unit: unit,
        quantity: item.quantity,
      });
    }
  }

  return pantryMap;
};

export const matchPantry = ({
  ingredients,
  pantryItems,
}) => {
  if (!Array.isArray(ingredients)) {
    throw new Error("Ingredients must be an array");
  }

  const pantryMap = normalizePantry(pantryItems);

  return ingredients.map((ingredient) => {
    const name = normalizeName(ingredient.name);
    const unit = normalizeUnit(ingredient.unit);

    assertNonNegativeNumber(
      ingredient.quantity,
      "Required quantity"
    );

    const key = `${name}::${unit}`;
    const pantryItem = pantryMap.get(key);

    const availableQuantity = pantryItem
      ? pantryItem.quantity
      : 0;

    const shortage = Math.max(
      ingredient.quantity - availableQuantity,
      0
    );

    let status = "available";

    if (availableQuantity === 0) {
      status = "missing";
    } else if (shortage > 0) {
      status = "shortage";
    }

    return {
      name: ingredient.name,
      unit: ingredient.unit,
      requiredQuantity: ingredient.quantity,
      availableQuantity,
      shortage,
      status,
    };
  });
};

export const calculatePantryCoverage = (matches) => {
  if (!Array.isArray(matches)) {
    throw new Error("Pantry matches must be an array");
  }

  if (matches.length === 0) {
    return 100;
  }

  const fullyAvailable = matches.filter(
    (match) => match.status === "available"
  ).length;

  return (fullyAvailable / matches.length) * 100;
};
