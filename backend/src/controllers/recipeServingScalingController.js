import {
  scaleRecipeServings,
} from "../services/recipeServingScalingService.js";

export const scaleRecipeServingsController = async (req, res, next) => {
  try {
    const result = await scaleRecipeServings({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      servings: req.body.servings,
    });

    if (!result) {
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
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
