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
        dietaryRequirements:
          req.body.dietaryRequirements,
        mealType: req.body.mealType,
        maxPrepTime: req.body.maxPrepTime,
        budgetPriority: req.body.budgetPriority,
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
