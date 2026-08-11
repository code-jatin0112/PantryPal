import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

export const scaleRecipeServings = async ({
  userId,
  recipeId,
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

  if (!recipe.servings) {
    throw new AppError(
      "Recipe servings are not defined",
      400,
      "RECIPE_SERVINGS_NOT_DEFINED"
    );
  }

  const multiplier = servings / recipe.servings;

  const ingredients = recipe.ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    quantity: Number(
      (ingredient.quantity * multiplier).toFixed(2)
    ),
    unit: ingredient.unit,
  }));

  return {
    recipe: {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
    },
    originalServings: recipe.servings,
    requestedServings: servings,
    scalingMultiplier: Number(multiplier.toFixed(4)),
    ingredients,
  };
};
