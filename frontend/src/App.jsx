import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import ProtectedRoute from './components/ProtectedRoute';
import { FullPageSpinner } from './components/ui/Spinner';
import DashboardLayout from './components/layout/DashboardLayout';

// ── Lazy-loaded pages (code splitting) ───────────────────
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'));
const NotFound           = lazy(() => import('./pages/NotFound'));
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const Pantry             = lazy(() => import('./pages/Pantry'));
const AddPantryItem      = lazy(() => import('./pages/Pantry/AddPantryItem'));
const EditPantryItem     = lazy(() => import('./pages/Pantry/EditPantryItem'));
const Recipes            = lazy(() => import('./pages/Recipes'));
const RecipeDetails      = lazy(() => import('./pages/Recipes/RecipeDetails'));
const CreateRecipe       = lazy(() => import('./pages/Recipes/CreateRecipe'));
const EditRecipe         = lazy(() => import('./pages/Recipes/EditRecipe'));
const CookingMode        = lazy(() => import('./pages/CookingMode/CookingMode'));
const AIRecommendations  = lazy(() => import('./pages/AIRecommendations/AIRecommendations'));
const AIChat             = lazy(() => import('./pages/AIChat/AIChat'));
const ShoppingList       = lazy(() => import('./pages/ShoppingList'));
const MealPlans          = lazy(() => import('./pages/MealPlans/MealPlans'));
const MealPlanDetails    = lazy(() => import('./pages/MealPlans/MealPlanDetails'));
const CreateMealPlan     = lazy(() => import('./pages/MealPlans/CreateMealPlan'));
const EditMealPlan       = lazy(() => import('./pages/MealPlans/EditMealPlan'));
const MealPlanner        = lazy(() => import('./pages/MealPlanner'));
const Assistant          = lazy(() => import('./pages/Assistant'));
const SearchPage         = lazy(() => import('./pages/Search/Search'));
const Notifications      = lazy(() => import('./pages/Notifications/Notifications'));
const Settings           = lazy(() => import('./pages/Settings/Settings'));
const Preferences        = lazy(() => import('./pages/Preferences'));
const Profile            = lazy(() => import('./pages/Profile'));

// ── Page transition wrapper ───────────────────────────────
const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ── App Layout (authenticated shell) ─────────────────────
const AppLayout = () => {
  return (
    <DashboardLayout>
      <Suspense fallback={<FullPageSpinner label="Loading page…" />}>
        <PageTransition>
          <Routes>
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/pantry"              element={<Pantry />} />
            <Route path="/pantry/add"          element={<AddPantryItem />} />
            <Route path="/pantry/:id/edit"     element={<EditPantryItem />} />
            <Route path="/recipes"             element={<Recipes />} />
            <Route path="/recipes/new"         element={<CreateRecipe />} />
            <Route path="/recipes/:id"         element={<RecipeDetails />} />
            <Route path="/recipes/:id/edit"    element={<EditRecipe />} />
            <Route path="/cooking/:recipeId"   element={<CookingMode />} />
            <Route path="/cooking"             element={<CookingMode />} />
            <Route path="/ai-recommendations"  element={<AIRecommendations />} />
            <Route path="/ai-chat"             element={<AIChat />} />
            <Route path="/shopping-list"       element={<ShoppingList />} />
            <Route path="/meal-plans"          element={<MealPlans />} />
            <Route path="/meal-plans/new"      element={<CreateMealPlan />} />
            <Route path="/meal-plans/:id"      element={<MealPlanDetails />} />
            <Route path="/meal-plans/:id/edit" element={<EditMealPlan />} />
            <Route path="/meal-planner"        element={<MealPlanner />} />
            <Route path="/assistant"           element={<Assistant />} />
            <Route path="/search"              element={<SearchPage />} />
            <Route path="/notifications"       element={<Notifications />} />
            <Route path="/settings"            element={<Settings />} />
            <Route path="/preferences"         element={<Preferences />} />
            <Route path="/profile"             element={<Profile />} />
            <Route path="*"                    element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </DashboardLayout>
  );
};

// ── Root App ──────────────────────────────────────────────
function App() {
  return (
    <Suspense fallback={<FullPageSpinner label="Starting PantryPal…" />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected app shell */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
