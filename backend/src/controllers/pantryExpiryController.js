import {
  getExpiringPantryItems,
  getExpiredPantryItems,
} from "../services/pantryExpiryService.js";

export const getExpiring = async (req, res, next) => {
  try {
    const items = await getExpiringPantryItems({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      days:
        req.query.days !== undefined
          ? Number(req.query.days)
          : 7,
    });

    return res.status(200).json({
      success: true,
      data: {
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpired = async (req, res, next) => {
  try {
    const items = await getExpiredPantryItems({
      userId: req.user.id,
      pantryId: req.params.pantryId,
    });

    return res.status(200).json({
      success: true,
      data: {
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};