import {
  addRecipeFavorite,
  getFavoriteRecipes,
  removeRecipeFavorite,
  isRecipeFavorited,
} from "../services/recipeFavoriteService.js";

export const addRecipeFavoriteController = async (req, res, next) => {
  try {
    const result = await addRecipeFavorite({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (result.type === "RECIPE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
      });
    }

    if (result.type === "ALREADY_FAVORITED") {
      return res.status(409).json({
        success: false,
        error: {
          code: "RECIPE_ALREADY_FAVORITED",
          message: "Recipe is already in favorites",
        },
        data: {
          favorite: result.data,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        favorite: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFavoriteRecipesController = async (req, res, next) => {
  try {
    const favorites = await getFavoriteRecipes({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        favorites,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeRecipeFavoriteController = async (req, res, next) => {
  try {
    const deleted = await removeRecipeFavorite({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_FAVORITE_NOT_FOUND",
          message: "Recipe is not in favorites",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const isRecipeFavoritedController = async (req, res, next) => {
  try {
    const isFavorited = await isRecipeFavorited({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });

    return res.status(200).json({
      success: true,
      data: {
        isFavorited,
      },
    });
  } catch (error) {
    next(error);
  }
};
