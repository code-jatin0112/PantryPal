import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Pantry from "../pages/Pantry/Pantry";
import Recipes from "../pages/Recipes/Recipes";
import MealPlanner from "../pages/MealPlanner/MealPlanner";
import ShoppingList from "../pages/ShoppingList/ShoppingList";
import AIRecommendations from "../pages/AIRecommendations/AIRecommendations";
import AIChat from "../pages/AIChat/AIChat";
import CookingMode from "../pages/CookingMode/CookingMode";
import Settings from "../pages/Settings/Settings";
import NotFound from "../pages/NotFound/NotFound";

import { ROUTES } from "../constants/routes";

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />

      {/* Protected Application Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.PANTRY} element={<Pantry />} />
        <Route path={ROUTES.RECIPES} element={<Recipes />} />
        <Route path={ROUTES.MEAL_PLANNER} element={<MealPlanner />} />
        <Route path={ROUTES.SHOPPING_LIST} element={<ShoppingList />} />
        <Route
          path={ROUTES.AI_RECOMMENDATIONS}
          element={<AIRecommendations />}
        />
        <Route path={ROUTES.AI_CHAT} element={<AIChat />} />
        <Route path={ROUTES.COOKING_MODE} element={<CookingMode />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;

