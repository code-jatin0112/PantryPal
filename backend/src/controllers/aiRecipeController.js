import {
  generateRecipeFromPantry,
} from "../services/aiRecipeService.js";

export const generateAIRecipeController = async (
  req,
  res,
  next
) => {
  try {
    const result = await generateRecipeFromPantry({
      userId: req.user.id,
      pantryId: req.body.pantryId,
      servings: req.body.servings,
      budget: req.body.budget,
      preferences: req.body.preferences,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};