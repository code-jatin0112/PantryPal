import {
  completeCookingSession,
} from "../services/cookingSessionCompletionService.js";

export const completeSession = async (req, res, next) => {
  try {
    const result = await completeCookingSession({
      userId: req.user.id,
      sessionId: req.params.sessionId,
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