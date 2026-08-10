import {
  createMealPlan,
  getMealPlans,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
} from "../services/mealPlanService.js";

export const createMealPlanController = async (req, res, next) => {
  try {
    const mealPlan = await createMealPlan({
      userId: req.user.id,
      recipeId: req.body.recipeId,
      date: new Date(req.body.date),
      mealType: req.body.mealType,
      notes: req.body.notes,
    });

    if (!mealPlan) {
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
        mealPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMealPlansController = async (req, res, next) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : undefined;

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : undefined;

    const mealPlans = await getMealPlans({
      userId: req.user.id,
      startDate,
      endDate,
      mealType: req.query.mealType,
    });

    return res.status(200).json({
      success: true,
      data: {
        mealPlans,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMealPlanByIdController = async (req, res, next) => {
  try {
    const mealPlan = await getMealPlanById({
      userId: req.user.id,
      mealPlanId: req.params.mealPlanId,
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MEAL_PLAN_NOT_FOUND",
          message: "Meal plan not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        mealPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMealPlanController = async (req, res, next) => {
  try {
    const mealPlan = await updateMealPlan({
      userId: req.user.id,
      mealPlanId: req.params.mealPlanId,
      recipeId: req.body.recipeId,
      date: req.body.date
        ? new Date(req.body.date)
        : undefined,
      mealType: req.body.mealType,
      notes: req.body.notes,
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MEAL_PLAN_NOT_FOUND",
          message: "Meal plan or recipe not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        mealPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMealPlanController = async (req, res, next) => {
  try {
    const deleted = await deleteMealPlan({
      userId: req.user.id,
      mealPlanId: req.params.mealPlanId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MEAL_PLAN_NOT_FOUND",
          message: "Meal plan not found",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};