import {
  getLowStockPantryItems,
} from "../services/pantryLowStockService.js";

export const getLowStock = async (req, res, next) => {
  try {
    const items = await getLowStockPantryItems({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      threshold:
        req.query.threshold !== undefined
          ? Number(req.query.threshold)
          : 5,
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