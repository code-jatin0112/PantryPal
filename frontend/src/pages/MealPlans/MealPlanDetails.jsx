import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';

import MealPlanSummary from '../../components/mealPlans/MealPlanSummary';
import MealPlanCalendar from '../../components/mealPlans/MealPlanCalendar';
import PantryCoverage from '../../components/mealPlans/PantryCoverage';
import NutritionSummary from '../../components/mealPlans/NutritionSummary';
import GroceryRequirements from '../../components/mealPlans/GroceryRequirements';
import DeleteMealPlanDialog from '../../components/mealPlans/DeleteMealPlanDialog';
import MealPlanSkeleton from '../../components/mealPlans/MealPlanSkeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

import {
  getMealPlanById,
  deleteMealPlan,
  evaluateMealPlan,
  getMealPlanGroceryRequirements,
} from '../../services/mealPlanService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const MealPlanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { activePantry } = usePantry();

  const [mealPlan, setMealPlan] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [groceryReqs, setGroceryReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getMealPlanById(id);
      const plan = res.data.data?.mealPlan || res.data.data;
      setMealPlan(plan);

      // If active pantry exists, fetch evaluation and grocery requirements
      if (activePantry?.id) {
        const [evalRes, grocRes] = await Promise.allSettled([
          evaluateMealPlan(id, activePantry.id),
          getMealPlanGroceryRequirements(id, activePantry.id),
        ]);

        if (evalRes.status === 'fulfilled') {
          setEvaluation(evalRes.value.data?.data);
        }
        if (grocRes.status === 'fulfilled') {
          setGroceryReqs(grocRes.value.data?.data);
        }
      }
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to load meal plan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, activePantry]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteMealPlan(id);
      toast('Meal plan deleted.', 'info');
      navigate('/meal-plans');
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to delete meal plan.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <MealPlanSkeleton view="details" />;
  }

  if (!mealPlan) {
    return (
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-12 text-center max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-[var(--color-dark)]">Meal Plan Not Found</h2>
        <p className="text-xs text-[var(--color-sage)]">
          The requested meal plan could not be found or may have been deleted.
        </p>
        <Button variant="primary" onClick={() => navigate('/meal-plans')}>
          Back to Meal Plans
        </Button>
      </div>
    );
  }

  const name = mealPlan.name || 'Untitled Meal Plan';
  const startDate = mealPlan.startDate ? new Date(mealPlan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const endDate = mealPlan.endDate ? new Date(mealPlan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate || 'Flexible Schedule';

  const dishes = mealPlan.dishes || [];
  const priority = (mealPlan.budgetPriority || 'medium').toLowerCase();
  const priorityVariant =
    priority === 'high' ? 'danger' : priority === 'low' ? 'neutral' : 'warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
    >
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/meal-plans')}
          className="flex items-center gap-2 text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Meal Plans</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={() => navigate(`/meal-plans/${id}/edit`)}
          >
            Edit Plan
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete plan"
          />
        </div>
      </div>

      {/* ── Hero Overview Card ── */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={priorityVariant} size="sm">
                {priority.toUpperCase()} PRIORITY
              </Badge>
              <span className="text-xs font-bold text-[var(--color-sage)]">
                {dishes.length} Scheduled Dish{dishes.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
              {name}
            </h1>
            <p className="text-xs font-semibold text-[var(--color-sage)] mt-1 flex items-center gap-1.5">
              <Calendar size={13} />
              <span>{dateRange}</span>
            </p>
          </div>

          <div className="bg-[var(--color-parchment)] px-4 py-3 rounded-xl border border-[rgba(138,144,112,0.12)] text-right self-start">
            <span className="text-[11px] font-semibold text-[var(--color-sage)] uppercase block">
              Budget Target
            </span>
            <span className="text-lg font-extrabold text-[var(--color-dark)] tabular-nums">
              {mealPlan.budget ? `$${Number(mealPlan.budget).toFixed(2)}` : 'Flexible'}
            </span>
          </div>
        </div>

        {/* Quick Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[rgba(138,144,112,0.10)] text-xs font-semibold text-[var(--color-sage)]">
          <div className="flex items-center gap-2">
            <Users size={15} />
            <span>Serving: <strong className="text-[var(--color-dark)]">{mealPlan.peopleCount || 2} persons</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={15} />
            <span>Duration: <strong className="text-[var(--color-dark)]">7 Days</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[var(--color-sage)]" />
            <span>Pantry: <strong className="text-[var(--color-dark)]">{activePantry?.name || 'Kitchen'}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Pantry Coverage Feasibility Card ── */}
      <PantryCoverage
        evaluation={evaluation}
        pantryName={activePantry?.name || 'My Kitchen Pantry'}
      />

      {/* ── Nutrition Aggregate Breakdown ── */}
      <NutritionSummary
        nutrition={evaluation?.nutrition || mealPlan.nutritionSummary}
        daysCount={7}
      />

      {/* ── Menu Breakdown (Breakfast, Lunch, Dinner, Snacks) ── */}
      <MealPlanSummary
        dishes={dishes}
        peopleCount={mealPlan.peopleCount || 2}
      />

      {/* ── Weekly Schedule Calendar ── */}
      <MealPlanCalendar
        dishes={dishes}
        startDate={mealPlan.startDate}
        endDate={mealPlan.endDate}
      />

      {/* ── Grocery Requirements & One-click Sync ── */}
      <GroceryRequirements
        requirements={groceryReqs || evaluation?.missingIngredients}
        mealPlanName={name}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteMealPlanDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        mealPlanName={name}
        loading={deleting}
      />
    </motion.div>
  );
};

export default MealPlanDetails;
