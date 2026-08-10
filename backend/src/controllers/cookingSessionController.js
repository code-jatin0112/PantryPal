import {
  startCookingSession,
  getCookingSession,
  updateCookingProgress,
} from "../services/cookingSessionService.js";

export const startSession = async (req, res, next) => {
  try {
    const session = await startCookingSession({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      servings: req.body.servings,
    });

    return res.status(201).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const session = await getCookingSession({
      userId: req.user.id,
      sessionId: req.params.sessionId,
    });

    return res.status(200).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const session = await updateCookingProgress({
      userId: req.user.id,
      sessionId: req.params.sessionId,
      currentStep: req.body.currentStep,
    });

    return res.status(200).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};