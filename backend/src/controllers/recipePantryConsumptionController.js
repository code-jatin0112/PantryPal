import {
  consumeRecipeFromPantry,
} from "../services/recipePantryConsumptionService.js";

export const consumeRecipe = async (req, res, next) => {
  try {
    const result = await consumeRecipeFromPantry({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      pantryId: req.body.pantryId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};