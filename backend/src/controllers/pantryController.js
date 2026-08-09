import {
  createPantry,
  getUserPantries,
  getPantryById,
  updatePantry,
  deletePantry,
} from "../services/pantryService.js";

export const create = async (req, res, next) => {
  try {
    const pantry = await createPantry({
      userId: req.user.id,
      name: req.body.name,
    });

    return res.status(201).json({
      success: true,
      data: {
        pantry,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const pantries = await getUserPantries(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        pantries,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const pantry = await getPantryById({
      userId: req.user.id,
      pantryId: req.params.pantryId,
    });

    return res.status(200).json({
      success: true,
      data: {
        pantry,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const pantry = await updatePantry({
      userId: req.user.id,
      pantryId: req.params.pantryId,
      name: req.body.name,
    });

    return res.status(200).json({
      success: true,
      data: {
        pantry,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await deletePantry({
      userId: req.user.id,
      pantryId: req.params.pantryId,
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};