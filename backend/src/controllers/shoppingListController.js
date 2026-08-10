import {
  createShoppingListItem,
  getShoppingListItems,
  getShoppingListItemById,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedShoppingListItems,
} from "../services/shoppingListService.js";

export const createShoppingListItemController = async (req, res, next) => {
  try {
    const item = await createShoppingListItem({
      userId: req.user.id,
      recipeId: req.body.recipeId,
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        item,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getShoppingListItemsController = async (req, res, next) => {
  try {
    const isPurchased =
      req.query.isPurchased !== undefined
        ? req.query.isPurchased === "true"
        : undefined;

    const items = await getShoppingListItems({
      userId: req.user.id,
      isPurchased,
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

export const getShoppingListItemByIdController = async (req, res, next) => {
  try {
    const item = await getShoppingListItemById({
      userId: req.user.id,
      itemId: req.params.itemId,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SHOPPING_LIST_ITEM_NOT_FOUND",
          message: "Shopping list item not found",
        },
      });
    }

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

export const updateShoppingListItemController = async (req, res, next) => {
  try {
    const item = await updateShoppingListItem({
      userId: req.user.id,
      itemId: req.params.itemId,
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
      isPurchased: req.body.isPurchased,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SHOPPING_LIST_ITEM_NOT_FOUND",
          message: "Shopping list item not found",
        },
      });
    }

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

export const deleteShoppingListItemController = async (req, res, next) => {
  try {
    const deleted = await deleteShoppingListItem({
      userId: req.user.id,
      itemId: req.params.itemId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SHOPPING_LIST_ITEM_NOT_FOUND",
          message: "Shopping list item not found",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const clearPurchasedShoppingListItemsController = async (
  req,
  res,
  next
) => {
  try {
    const deletedCount = await clearPurchasedShoppingListItems({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};