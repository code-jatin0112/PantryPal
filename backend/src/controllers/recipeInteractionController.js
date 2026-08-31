import {
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes,
  rateRecipe,
  addRecipeHistory,
  getRecipeHistory,
} from "../services/recipeInteractionService.js";

export const handleSaveRecipe = async (req, res, next) => {
  try {
    const result = await saveRecipe({
      userId: req.user.id,
      recipeId: req.body.recipeId || req.params.id,
      notes: req.body.notes,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUnsaveRecipe = async (req, res, next) => {
  try {
    const result = await unsaveRecipe({
      userId: req.user.id,
      recipeId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetSavedRecipes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await getSavedRecipes({
      userId: req.user.id,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleRateRecipe = async (req, res, next) => {
  try {
    const result = await rateRecipe({
      userId: req.user.id,
      recipeId: req.params.id,
      rating: req.body.rating,
      review: req.body.review,
    });

    return res.status(201).json({
      success: true,
      data: { rating: result },
    });
  } catch (error) {
    next(error);
  }
};

export const handleAddHistory = async (req, res, next) => {
  try {
    const result = await addRecipeHistory({
      userId: req.user.id,
      recipeId: req.params.id,
      servingsCooked: req.body.servingsCooked,
      durationMinutes: req.body.durationMinutes,
      notes: req.body.notes,
      wastePreventedGrams: req.body.wastePreventedGrams,
    });

    return res.status(201).json({
      success: true,
      data: { history: result },
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await getRecipeHistory({
      userId: req.user.id,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

