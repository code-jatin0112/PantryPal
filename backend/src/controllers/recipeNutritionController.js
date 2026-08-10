import {
  createRecipeNutrition,
  getRecipeNutrition,
  updateRecipeNutrition,
  deleteRecipeNutrition,
} from "../services/recipeNutritionService.js";

export const createRecipeNutritionController = async (req, res, next) => {
  try {
    const nutrition = await createRecipeNutrition({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      calories: req.body.calories,
      protein: req.body.protein,
      carbohydrates: req.body.carbohydrates,
      fat: req.body.fat,
      fiber: req.body.fiber,
      sugar: req.body.sugar,
    });

    if (!nutrition) {
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
        nutrition,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipeNutritionController = async (req, res, next) => {
  try {
    const nutrition = await getRecipeNutrition({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (nutrition === null) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
      });
    }

    if (!nutrition) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NUTRITION_NOT_FOUND",
          message: "Recipe nutrition not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        nutrition,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecipeNutritionController = async (req, res, next) => {
  try {
    const nutrition = await updateRecipeNutrition({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      calories: req.body.calories,
      protein: req.body.protein,
      carbohydrates: req.body.carbohydrates,
      fat: req.body.fat,
      fiber: req.body.fiber,
      sugar: req.body.sugar,
    });

    if (!nutrition) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NUTRITION_NOT_FOUND",
          message: "Recipe nutrition not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        nutrition,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecipeNutritionController = async (req, res, next) => {
  try {
    const deleted = await deleteRecipeNutrition({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NUTRITION_NOT_FOUND",
          message: "Recipe nutrition not found",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};