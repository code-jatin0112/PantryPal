import {
  startCookingSession,
  getCookingSession,
  getActiveCookingSession,
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
    if (error.code === "ACTIVE_COOKING_SESSION_EXISTS") {
      return res.status(409).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        data: {
          session: error.session || null,
        },
      });
    }
    next(error);
  }
};

export const getActiveSession = async (req, res, next) => {
  try {
    const session = await getActiveCookingSession({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ACTIVE_COOKING_SESSION_NOT_FOUND",
          message: "No active cooking session found for this recipe",
        },
      });
    }

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