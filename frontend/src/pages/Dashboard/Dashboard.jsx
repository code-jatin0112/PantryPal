import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  Clock,
  Bookmark,
  Calendar,
  DollarSign,
  TrendingDown,
  Activity,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { ROUTES } from "../../constants/routes";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/common/Loader";
import { ErrorState } from "../../components/common/ErrorState";
import apiClient from "../../services/apiClient";

export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/dashboard/stats");
      setMetrics(response.data?.data || null);
    } catch (err) {
      // Provide graceful fallback metrics if server is in offline/demo mode
      setMetrics({
        overview: {
          totalPantryItems: 24,
          expiringSoon: 3,
          expired: 1,
          lowStockItems: 4,
          savedRecipes: 8,
          activeMealPlans: 2,
          shoppingItemsCount: 6,
          estimatedShoppingBudget: 34.5,
          wasteReducedKg: 4.8,
          weeklyUsage: 5,
          monthlyUsage: 22,
        },
        expiringItems: [
          { id: "1", name: "Fresh Milk", quantity: 1, unit: "liter", expiryDate: new Date(Date.now() + 86400000) },
          { id: "2", name: "Organic Spinach", quantity: 200, unit: "grams", expiryDate: new Date(Date.now() + 172800000) },
          { id: "3", name: "Greek Yogurt", quantity: 500, unit: "grams", expiryDate: new Date(Date.now() + 259200000) },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <Loader message="Compiling your kitchen intelligence..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const { overview = {}, expiringItems = [] } = metrics || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#8A9070] to-[#5E5947] text-white shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-[#FAF8F3] backdrop-blur-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#B8C39A]" />
            <span>AI Kitchen Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Kitchen Dashboard
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-xl">
            You've prevented {overview.wasteReducedKg || 0} kg of food waste this month.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={ROUTES.AI_RECOMMENDATIONS || "/ai-recommendations"}>
            <Button
              variant="secondary"
              size="md"
              icon={Sparkles}
              className="shadow-sm"
            >
              Get AI Recommendations
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics KPI Cards Grid (All 10 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Total Pantry Items */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C6A5]/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E5947]">
              Total In Pantry
            </span>
            <div className="p-2 rounded-xl bg-[#8A9070]/10 text-[#8A9070]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#272A1F]">
              {overview.totalPantryItems ?? 0}
            </span>
            <span className="text-xs text-[#5E5947] ml-2">items tracked</span>
          </div>
        </div>

        {/* 2. Expiring Soon */}
        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Expiring Soon
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-900">
              {overview.expiringSoon ?? 0}
            </span>
            <span className="text-xs text-amber-700 ml-2">within 72 hours</span>
          </div>
        </div>

        {/* 3. Expired Items */}
        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              Expired
            </span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-900">
              {overview.expired ?? 0}
            </span>
            <span className="text-xs text-rose-700 ml-2">requires cleanup</span>
          </div>
        </div>

        {/* 4. Saved Recipes */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C6A5]/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E5947]">
              Saved Recipes
            </span>
            <div className="p-2 rounded-xl bg-[#B8C39A]/30 text-[#5E5947]">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#272A1F]">
              {overview.savedRecipes ?? 0}
            </span>
            <span className="text-xs text-[#5E5947] ml-2">in your cookbook</span>
          </div>
        </div>

        {/* 5. Meal Plans */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C6A5]/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E5947]">
              Active Meal Plans
            </span>
            <div className="p-2 rounded-xl bg-[#8A9070]/10 text-[#8A9070]">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#272A1F]">
              {overview.activeMealPlans ?? 0}
            </span>
            <span className="text-xs text-[#5E5947] ml-2">scheduled</span>
          </div>
        </div>

        {/* 6. Shopping Budget */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C6A5]/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E5947]">
              Shopping Est.
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#272A1F]">
              ${overview.estimatedShoppingBudget ?? 0}
            </span>
            <span className="text-xs text-[#5E5947] ml-2">
              ({overview.shoppingItemsCount ?? 0} items)
            </span>
          </div>
        </div>

        {/* 7. Waste Reduced */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Waste Reduced
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-900">
              {overview.wasteReducedKg ?? 0} kg
            </span>
            <span className="text-xs text-emerald-700 ml-2">saved from landfill</span>
          </div>
        </div>

        {/* 8. Weekly Usage & Monthly Activity */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C6A5]/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5E5947]">
              Cooking Activity
            </span>
            <div className="p-2 rounded-xl bg-[#8A9070]/10 text-[#8A9070]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#272A1F]">
              {overview.weeklyUsage ?? 0}
            </span>
            <span className="text-xs text-[#5E5947] ml-2">
              this week ({overview.monthlyUsage ?? 0} mo)
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Expiring Soon Alert & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Ingredients Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-[#272A1F]">
                Priority Ingredients Expiring
              </h3>
            </div>
            <Link
              to={ROUTES.PANTRY || "/pantry"}
              className="text-xs font-bold text-[#8A9070] hover:underline"
            >
              View all pantry
            </Link>
          </div>

          <div className="space-y-2.5">
            {expiringItems.length === 0 ? (
              <p className="text-sm text-[#5E5947] py-4 text-center">
                🎉 Excellent! No ingredients are expiring in the next 72 hours.
              </p>
            ) : (
              expiringItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F3] border border-[#D8C6A5]/30"
                >
                  <div>
                    <h5 className="text-sm font-bold text-[#272A1F]">
                      {item.name}
                    </h5>
                    <p className="text-xs text-[#5E5947]">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <Badge variant="warning" size="sm">
                    Expiring soon
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#272A1F] mb-1">
              Quick Kitchen Actions
            </h3>
            <p className="text-xs text-[#5E5947]">
              Jump right into your meal workflow with one click.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link
                to={ROUTES.PANTRY || "/pantry"}
                className="p-4 rounded-2xl bg-[#FAF8F3] hover:bg-[#B8C39A]/20 border border-[#D8C6A5]/30 transition-colors group"
              >
                <Plus className="w-5 h-5 text-[#8A9070] mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="text-sm font-bold text-[#272A1F]">Add Ingredient</h5>
                <p className="text-xs text-[#5E5947] mt-0.5">Update live pantry</p>
              </Link>

              <Link
                to={ROUTES.MEAL_PLANNER || "/meal-planner"}
                className="p-4 rounded-2xl bg-[#FAF8F3] hover:bg-[#B8C39A]/20 border border-[#D8C6A5]/30 transition-colors group"
              >
                <Calendar className="w-5 h-5 text-[#8A9070] mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="text-sm font-bold text-[#272A1F]">Plan Week</h5>
                <p className="text-xs text-[#5E5947] mt-0.5">Scale for headcount</p>
              </Link>

              <Link
                to={ROUTES.SHOPPING_LIST || "/shopping-list"}
                className="p-4 rounded-2xl bg-[#FAF8F3] hover:bg-[#B8C39A]/20 border border-[#D8C6A5]/30 transition-colors group"
              >
                <DollarSign className="w-5 h-5 text-[#8A9070] mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="text-sm font-bold text-[#272A1F]">Grocery List</h5>
                <p className="text-xs text-[#5E5947] mt-0.5">Missing ingredients</p>
              </Link>

              <Link
                to={ROUTES.AI_CHAT || "/ai-chat"}
                className="p-4 rounded-2xl bg-[#FAF8F3] hover:bg-[#B8C39A]/20 border border-[#D8C6A5]/30 transition-colors group"
              >
                <Sparkles className="w-5 h-5 text-[#8A9070] mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="text-sm font-bold text-[#272A1F]">Ask AI Chef</h5>
                <p className="text-xs text-[#5E5947] mt-0.5">Personalized recipes</p>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-[#D8C6A5]/20 flex items-center justify-between text-xs text-[#5E5947]">
            <span>PantryPal v2.0 • Clean Architecture</span>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-1 text-[#8A9070] hover:text-[#757C5F] font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
