const UNIT_GROUPS = {
  weight: {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
  },

  volume: {
    ml: 1,
    milliliter: 1,
    milliliters: 1,
    l: 1000,
    liter: 1000,
    liters: 1000,
    litre: 1000,
    litres: 1000,
  },

  count: {
    piece: 1,
    pieces: 1,
    pc: 1,
    pcs: 1,
    item: 1,
    items: 1,
    unit: 1,
    units: 1,
  },
};

export const normalizeIngredientName = (name) => {
  return name.trim().toLowerCase();
};

const findUnitGroup = (unit) => {
  const normalizedUnit = unit.trim().toLowerCase();

  for (const [group, units] of Object.entries(UNIT_GROUPS)) {
    if (normalizedUnit in units) {
      return {
        group,
        multiplier: units[normalizedUnit],
      };
    }
  }

  return null;
};

export const normalizeQuantity = (quantity, unit) => {
  const unitInfo = findUnitGroup(unit);

  if (!unitInfo) {
    return null;
  }

  return {
    group: unitInfo.group,
    quantity: quantity * unitInfo.multiplier,
  };
};

export const compareIngredientQuantity = ({
  requiredQuantity,
  requiredUnit,
  availableQuantity,
  availableUnit,
}) => {
  const required = normalizeQuantity(requiredQuantity, requiredUnit);
  const available = normalizeQuantity(availableQuantity, availableUnit);

  if (!required || !available) {
    return {
      comparable: false,
      sufficient: false,
    };
  }

  if (required.group !== available.group) {
    return {
      comparable: false,
      sufficient: false,
    };
  }

  return {
    comparable: true,
    sufficient: available.quantity >= required.quantity,
  };
};