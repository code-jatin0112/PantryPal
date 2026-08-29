import {
  getUserPreferences,
  updateUserPreferences,
} from "../services/userPreferenceService.js";

export const getPreferences = async (req, res, next) => {
  try {
    const preferences = await getUserPreferences(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await updateUserPreferences(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      data: {
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

