import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Users, DollarSign, Clock, ChefHat, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import mealPlanService from "../../services/mealPlanService";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

export const MealPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Plan Modal State
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [newPlanData, setNewPlanData] = useState({
    name: "Weekly Schedule",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    peopleCount: 2,
    budget: 65,
  });

  const fetchMealPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await mealPlanService.getMealPlans();
      const planList = response.data?.mealPlans || [];
      setPlans(planList);
      if (planList.length > 0) {
        setActivePlan(planList[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load meal plans");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await mealPlanService.createMealPlan({
        name: newPlanData.name,
        startDate: new Date(newPlanData.startDate),
        endDate: new Date(newPlanData.endDate),
        peopleCount: parseInt(newPlanData.peopleCount, 10),
        budget: parseFloat(newPlanData.budget),
        meals: [],
      });
      const created = res.data?.mealPlan;
      if (created) {
        setPlans((prev) => [created, ...prev]);
        setActivePlan(created);
        setIsNewPlanModalOpen(false);
      }
    } catch (err) {
      alert(err.message || "Failed to create meal plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Delete this entire meal plan?")) return;
    try {
      await mealPlanService.deleteMealPlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      setActivePlan(plans.find((p) => p.id !== planId) || null);
    } catch (err) {
      alert(err.message || "Failed to delete meal plan");
    }
  };

  if (isLoading) {
    return <Loader message="Loading meal planning schedule..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchMealPlans} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#272A1F] tracking-tight">
            Weekly Meal Planner
          </h2>
          <p className="text-sm text-[#5E5947]">
            Plan ahead, calculate portions for your household, and minimize waste.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsNewPlanModalOpen(true)}
          className="shadow-sm"
        >
          Create New Plan
        </Button>
      </div>

      {/* Plan Details Card */}
      {activePlan ? (
        <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8C6A5]/30">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#272A1F]">
                {activePlan.name}
              </h3>
              <p className="text-xs text-[#5E5947]">
                {new Date(activePlan.startDate).toLocaleDateString()} —{" "}
                {new Date(activePlan.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#5E5947]">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#D8C6A5]/30">
                <Users className="w-4 h-4 text-[#8A9070]" />
                <span>{activePlan.peopleCount || 2} People</span>
              </div>

              {activePlan.budget && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#D8C6A5]/30">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Budget: ${activePlan.budget}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDeletePlan(activePlan.id)}
                className="p-1.5 rounded-lg text-[#5E5947] hover:text-red-600 transition-colors cursor-pointer"
                title="Delete Plan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#D8C6A5]/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#272A1F]">{day}</h4>
                  <span className="text-[11px] font-semibold text-[#8A9070]">
                    Day {idx + 1}
                  </span>
                </div>

                <div className="space-y-2">
                  {MEAL_TYPES.map((type) => (
                    <div
                      key={type}
                      className="p-2.5 rounded-xl bg-white border border-[#D8C6A5]/30 shadow-2xs text-xs"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5947] block mb-1">
                        {type}
                      </span>
                      <p className="text-xs font-semibold text-[#272A1F] truncate">
                        {idx === 0 && type === "dinner"
                          ? "Spaghetti Carbonara"
                          : idx === 1 && type === "lunch"
                          ? "Greek Salad with Feta"
                          : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No Active Meal Plans"
          description="Create a meal plan to organize your meals for the upcoming week."
          actionLabel="Create First Plan"
          onAction={() => setIsNewPlanModalOpen(true)}
        />
      )}

      {/* New Plan Modal */}
      <Modal
        isOpen={isNewPlanModalOpen}
        onClose={() => setIsNewPlanModalOpen(false)}
        title="Create Weekly Meal Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <Input
            label="Plan Name"
            placeholder="e.g. Week 36 Family Meals"
            required
            value={newPlanData.name}
            onChange={(e) =>
              setNewPlanData({ ...newPlanData, name: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={newPlanData.startDate}
              onChange={(e) =>
                setNewPlanData({ ...newPlanData, startDate: e.target.value })
              }
            />

            <Input
              label="End Date"
              type="date"
              required
              value={newPlanData.endDate}
              onChange={(e) =>
                setNewPlanData({ ...newPlanData, endDate: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Headcount (People)"
              type="number"
              min="1"
              max="50"
              required
              value={newPlanData.peopleCount}
              onChange={(e) =>
                setNewPlanData({
                  ...newPlanData,
                  peopleCount: e.target.value,
                })
              }
            />

            <Input
              label="Target Budget ($)"
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 75"
              value={newPlanData.budget}
              onChange={(e) =>
                setNewPlanData({ ...newPlanData, budget: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8C6A5]/30">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNewPlanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MealPlanner;

