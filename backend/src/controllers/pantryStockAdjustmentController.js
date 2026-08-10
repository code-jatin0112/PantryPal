import {
  adjustPantryItemStock,
} from "../services/pantryItemService.js";

export const adjustStock = async (req, res, next) => {
  try {
    const item = await adjustPantryItemStock({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      itemId: req.params.itemId,
      change: Number(req.body.change),
    });

    return res.status(200).json({
      success: true,
      data: {
        item,
      },
    });
  } catch (error) {
    next(error);
  }
};