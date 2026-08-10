import {
  getRecipePantryAvailability,
} from "../services/recipePantryMatchingService.js";

export const getRecipePantryAvailabilityController = async (
  req,
  res,
  next
) => {
  try {
    const availability = await getRecipePantryAvailability({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      pantryId: req.params.pantryId,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_OR_PANTRY_NOT_FOUND",
          message: "Recipe or pantry not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};