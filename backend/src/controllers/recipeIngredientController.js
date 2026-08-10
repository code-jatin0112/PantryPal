import {
  createRecipeIngredient,
  getRecipeIngredients,
  getRecipeIngredientById,
  updateRecipeIngredient,
  deleteRecipeIngredient,
} from "../services/recipeIngredientService.js";

export const createRecipeIngredientController = async (req, res, next) => {
  try {
    const ingredient = await createRecipeIngredient({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        ingredient,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipeIngredientsController = async (req, res, next) => {
  try {
    const ingredients = await getRecipeIngredients({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (!ingredients) {
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
        ingredients,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipeIngredientByIdController = async (req, res, next) => {
  try {
    const ingredient = await getRecipeIngredientById({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      ingredientId: req.params.ingredientId,
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_INGREDIENT_NOT_FOUND",
          message: "Recipe ingredient not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ingredient,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecipeIngredientController = async (req, res, next) => {
  try {
    const ingredient = await updateRecipeIngredient({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      ingredientId: req.params.ingredientId,
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_INGREDIENT_NOT_FOUND",
          message: "Recipe ingredient not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ingredient,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecipeIngredientController = async (req, res, next) => {
  try {
    const deleted = await deleteRecipeIngredient({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      ingredientId: req.params.ingredientId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_INGREDIENT_NOT_FOUND",
          message: "Recipe ingredient not found",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};