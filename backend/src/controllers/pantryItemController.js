import {
  createPantryItem,
  getPantryItems,
  getPantryItemById,
  updatePantryItem,
  deletePantryItem,
} from "../services/pantryItemService.js";

export const create = async (req, res, next) => {
  try {
    const item = await createPantryItem({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
      expiryDate: req.body.expiryDate,
    });

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

export const getAll = async (req, res, next) => {
  try {
    const items = await getPantryItems({
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

export const getOne = async (req, res, next) => {
  try {
    const item = await getPantryItemById({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      itemId: req.params.itemId,
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

export const update = async (req, res, next) => {
  try {
    const item = await updatePantryItem({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      itemId: req.params.itemId,
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
      expiryDate: req.body.expiryDate,
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

export const remove = async (req, res, next) => {
  try {
    await deletePantryItem({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      itemId: req.params.itemId,
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};