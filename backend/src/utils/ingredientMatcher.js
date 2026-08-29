const UNIT_GROUPS = {
  weight: {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    mg: 0.001,
    milligram: 0.001,
    milligrams: 0.001,
    oz: 28.3495,
    ounce: 28.3495,
    ounces: 28.3495,
    lb: 453.592,
    lbs: 453.592,
    pound: 453.592,
    pounds: 453.592,
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
    cl: 10,
    centiliter: 10,
    centiliters: 10,
    dl: 100,
    deciliter: 100,
    deciliters: 100,
    tsp: 4.92892,
    teaspoon: 4.92892,
    teaspoons: 4.92892,
    tbsp: 14.7868,
    tablespoon: 14.7868,
    tablespoons: 14.7868,
    cup: 236.588,
    cups: 236.588,
    "fl oz": 29.5735,
    floz: 29.5735,
    "fluid ounce": 29.5735,
    "fluid ounces": 29.5735,
    pint: 473.176,
    pints: 473.176,
    pt: 473.176,
    quart: 946.353,
    quarts: 946.353,
    qt: 946.353,
    gallon: 3785.41,
    gallons: 3785.41,
    gal: 3785.41,
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
    clove: 1,
    cloves: 1,
    slice: 1,
    slices: 1,
    pinch: 1,
    pinches: 1,
    can: 1,
    cans: 1,
    bunch: 1,
    bunches: 1,
    stalk: 1,
    stalks: 1,
    head: 1,
    heads: 1,
    package: 1,
    packages: 1,
    pack: 1,
    packs: 1,
    bag: 1,
    bags: 1,
    bottle: 1,
    bottles: 1,
  },
};

export const normalizeIngredientName = (name) => {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
};

export const findUnitGroup = (unit) => {
  if (typeof unit !== "string") {
    return null;
  }

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
  if (typeof quantity !== "number" || isNaN(quantity)) {
    return null;
  }

  const unitInfo = findUnitGroup(unit);

  if (!unitInfo) {
    return null;
  }

  return {
    group: unitInfo.group,
    quantity: quantity * unitInfo.multiplier,
  };
};

export const convertUnitQuantity = (quantity, fromUnit, toUnit) => {
  if (typeof quantity !== "number" || isNaN(quantity)) {
    return null;
  }

  const normalizedFrom = typeof fromUnit === "string" ? fromUnit.trim().toLowerCase() : "";
  const normalizedTo = typeof toUnit === "string" ? toUnit.trim().toLowerCase() : "";

  if (normalizedFrom === normalizedTo) {
    return quantity;
  }

  const fromInfo = normalizeQuantity(quantity, normalizedFrom);
  const toUnitInfo = findUnitGroup(normalizedTo);

  if (!fromInfo || !toUnitInfo || fromInfo.group !== toUnitInfo.group) {
    return null;
  }

  return fromInfo.quantity / toUnitInfo.multiplier;
};

export const compareIngredientQuantity = ({
  requiredQuantity,
  requiredUnit,
  availableQuantity,
  availableUnit,
}) => {
  const normalizedReqUnit = typeof requiredUnit === "string" ? requiredUnit.trim().toLowerCase() : "";
  const normalizedAvailUnit = typeof availableUnit === "string" ? availableUnit.trim().toLowerCase() : "";

  if (normalizedReqUnit === normalizedAvailUnit) {
    return {
      comparable: true,
      sufficient: availableQuantity >= requiredQuantity,
    };
  }

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