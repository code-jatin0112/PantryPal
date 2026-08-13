import {
  createMealPlan,
  getMealPlans,
  getMealPlanById,
  updateMealPlan,
  addMealPlanDish,
  updateMealPlanDish,
  deleteMealPlanDish,
  deleteMealPlan,
} from "../services/mealPlanService.js";

export const createMealPlanController = async (req, res, next) => {
  try {
    const mealPlan = await createMealPlan({
      userId: req.user.id,
      name: req.body.name,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      peopleCount: req.body.peopleCount,
      budget: req.body.budget,
      dishes: req.body.dishes,
    });

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
      name: req.body.name,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      peopleCount: req.body.peopleCount,
      budget: req.body.budget,
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

export const addMealPlanDishController = async (req, res, next) => {
  try {
    const dish = await addMealPlanDish({
      userId: req.user.id,
      mealPlanId: req.params.mealPlanId,
      recipeId: req.body.recipeId,
      plannedDate: req.body.plannedDate,
      mealType: req.body.mealType,
      requestedServings: req.body.requestedServings,
      cuisine: req.body.cuisine,
      recipePreference: req.body.recipePreference,
      dietaryRequirements: req.body.dietaryRequirements,
      budgetPriority: req.body.budgetPriority,
      otherPreferences: req.body.otherPreferences,
    });

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MEAL_PLAN_NOT_FOUND",
          message: "Meal plan not found",
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        dish,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMealPlanDishController = async (req, res, next) => {
  try {
    const dish = await updateMealPlanDish({
      userId: req.user.id,
      mealPlanId: req.params.mealPlanId,
      dishId: req.params.dishId,
      recipeId: req.body.recipeId,
      plannedDate: req.body.plannedDate,
      mealType: req.body.mealType,
      requestedServings: req.body.requestedServings,
      cuisine: req.body.cuisine,
      recipePreference: req.body.recipePreference,
      dietaryRequirements: req.body.dietaryRequirements,
      budgetPriority: req.body.budgetPriority,
      otherPreferences: req.body.otherPreferences,
    });

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MEAL_PLAN_DISH_NOT_FOUND",
          message: "Meal plan dish not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        dish,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMealPlanDishController = async (req, res, next) => {
  try {
    const deleted = await deleteMealPlanDish({
      userId: req.user.id,
      mealPlanId: req.params.mealPlanId,
      dishId: req.params.dishId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MEAL_PLAN_DISH_NOT_FOUND",
          message: "Meal plan dish not found",
        },
      });
    }

    return res.status(204).send();
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
