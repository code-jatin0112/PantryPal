import prisma from "../config/database.js";
import {
  normalizeIngredientName,
  compareIngredientQuantity,
  convertUnitQuantity,
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
  servings,
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

  const targetServings = servings ? Number(servings) : (recipe.servings || 1);
  const baseServings = recipe.servings || 1;
  const scalingMultiplier = targetServings / baseServings;

  const pantryItemsByName = new Map();

  for (const item of pantry.items) {
    const normalizedName = normalizeIngredientName(item.name);
    const existing = pantryItemsByName.get(normalizedName);

    if (existing) {
      const convertedQty = convertUnitQuantity(item.quantity, item.unit, existing.unit);
      if (convertedQty !== null) {
        existing.quantity += convertedQty;
      } else {
        // Fallback if units cannot be converted
        existing.quantity += item.quantity;
      }
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
    const scaledRequiredQuantity = ingredient.quantity * scalingMultiplier;

    const pantryItem = pantryItemsByName.get(normalizedName);

    if (!pantryItem) {
      return {
        ingredientId: ingredient.id,
        name: ingredient.name,
        requiredQuantity: scaledRequiredQuantity,
        requiredUnit: ingredient.unit,
        pantryQuantity: 0,
        pantryUnit: null,
        status: "missing",
      };
    }

    const status = getAvailabilityStatus({
      pantryQuantity: pantryItem.quantity,
      requiredQuantity: scaledRequiredQuantity,
      requiredUnit: ingredient.unit,
      pantryUnit: pantryItem.unit,
    });

    return {
      ingredientId: ingredient.id,
      name: ingredient.name,
      requiredQuantity: scaledRequiredQuantity,
      requiredUnit: ingredient.unit,
      pantryQuantity: pantryItem.quantity,
      pantryUnit: pantryItem.unit,
      status,
    };
  });

  const summary = {
    total: ingredients.length,
    available: ingredients.filter((ing) => ing.status === "available").length,
    insufficient: ingredients.filter((ing) => ing.status === "insufficient").length,
    missing: ingredients.filter((ing) => ing.status === "missing").length,
    unitMismatch: ingredients.filter((ing) => ing.status === "unit_mismatch").length,
  };

  return {
    recipe: {
      id: recipe.id,
      title: recipe.title,
      servings: targetServings,
    },
    pantry: {
      id: pantry.id,
      name: pantry.name,
    },
    summary,
    ingredients,
  };
};