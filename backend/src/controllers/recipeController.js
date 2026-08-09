import {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
} from "../services/recipeService.js";

export const createRecipeController = async (req, res, next) => {
  try {
    const recipe = await createRecipe({
      userId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      instructions: req.body.instructions,
      prepTime: req.body.prepTime,
      cookTime: req.body.cookTime,
      servings: req.body.servings,
    });

    return res.status(201).json({
      success: true,
      data: {
        recipe,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipesController = async (req, res, next) => {
  try {
    const recipes = await getRecipes({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        recipes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipeByIdController = async (req, res, next) => {
  try {
    const recipe = await getRecipeById({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        recipe,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecipeController = async (req, res, next) => {
  try {
    const recipe = await updateRecipe({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      title: req.body.title,
      description: req.body.description,
      instructions: req.body.instructions,
      prepTime: req.body.prepTime,
      cookTime: req.body.cookTime,
      servings: req.body.servings,
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        recipe,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecipeController = async (req, res, next) => {
  try {
    const deleted = await deleteRecipe({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};