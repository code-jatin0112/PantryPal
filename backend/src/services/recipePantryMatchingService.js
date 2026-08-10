import prisma from "../config/database.js";

import {
  normalizeIngredientName,
  compareIngredientQuantity,
} from "../utils/ingredientMatcher.js";

const getAvailabilityStatus = ({
  pantryQuantity,
  requiredQuantity,
  requiredUnit,
  pantryUnit,
}) => {
  if (pantryQuantity <= 0) {
    return "missing";
  }

  const comparison = compareIngredientQuantity({
    requiredQuantity,
    requiredUnit,
    availableQuantity: pantryQuantity,
    availableUnit: pantryUnit,
  });

  if (!comparison.comparable) {
    return "unit_mismatch";
  }

  if (!comparison.sufficient) {
    return "insufficient";
  }

  return "available";
};

export const getRecipePantryAvailability = async ({
  userId,
  recipeId,
  pantryId,
}) => {
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    include: {
      ingredients: true,
    },
  });

  if (!recipe) {
    return null;
  }

  const pantry = await prisma.pantry.findFirst({
    where: {
      id: pantryId,
      userId,
    },
    include: {
      items: true,
    },
  });

  if (!pantry) {
    return null;
  }

  const pantryItemsByName = new Map();

  for (const item of pantry.items) {
    const normalizedName = normalizeIngredientName(item.name);

    const existing = pantryItemsByName.get(normalizedName);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      pantryItemsByName.set(normalizedName, {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      });
    }
  }

  const ingredients = recipe.ingredients.map((ingredient) => {
    const normalizedName = normalizeIngredientName(ingredient.name);

    const pantryItem = pantryItemsByName.get(normalizedName);

    if (!pantryItem) {
      return {
        ingredientId: ingredient.id,
        name: ingredient.name,
        requiredQuantity: ingredient.quantity,
        requiredUnit: ingredient.unit,
        pantryQuantity: 0,
        pantryUnit: null,
        status: "missing",
      };
    }

    const status = getAvailabilityStatus({
      pantryQuantity: pantryItem.quantity,
      requiredQuantity: ingredient.quantity,
      requiredUnit: ingredient.unit,
      pantryUnit: pantryItem.unit,
    });

    return {
      ingredientId: ingredient.id,
      name: ingredient.name,
      requiredQuantity: ingredient.quantity,
      requiredUnit: ingredient.unit,
      pantryQuantity: pantryItem.quantity,
      pantryUnit: pantryItem.unit,
      status,
    };
  });

  const summary = {
    total: ingredients.length,
    available: ingredients.filter(
      (ingredient) => ingredient.status === "available"
    ).length,
    insufficient: ingredients.filter(
      (ingredient) => ingredient.status === "insufficient"
    ).length,
    missing: ingredients.filter(
      (ingredient) => ingredient.status === "missing"
    ).length,
    unitMismatch: ingredients.filter(
      (ingredient) => ingredient.status === "unit_mismatch"
    ).length,
  };

  return {
    recipe: {
      id: recipe.id,
      title: recipe.title,
    },
    pantry: {
      id: pantry.id,
      name: pantry.name,
    },
    summary,
    ingredients,
  };
};