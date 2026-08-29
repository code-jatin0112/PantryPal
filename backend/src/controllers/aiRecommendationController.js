import {
  generateAIRecommendations,
} from "../services/aiRecommendationService.js";

export const generateAIRecommendationsController = async (
  req,
  res,
  next
) => {
  try {
    const result = await generateAIRecommendations({
      userId: req.user.id,
      pantryId: req.body.pantryId,
      mealPlanId: req.body.mealPlanId,
      preferences: {
        cuisine: req.body.cuisine,
        dietaryRequirements: req.body.dietaryRequirements,
        allergies: req.body.allergies,
        dislikedIngredients: req.body.dislikedIngredients,
        mealType: req.body.mealType,
        maxPrepTime: req.body.maxPrepTime,
        budgetPriority: req.body.budgetPriority,
        servings: req.body.servings,
        additionalNotes: req.body.additionalNotes,
      },
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
