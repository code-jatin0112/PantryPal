import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, Calendar, DollarSign, PackageCheck, Utensils } from 'lucide-react';

import MealPlanCard from '../../components/mealPlans/MealPlanCard';
import MealPlanTable from '../../components/mealPlans/MealPlanTable';
import MealPlanCalendar from '../../components/mealPlans/MealPlanCalendar';
import MealPlanFilters from '../../components/mealPlans/MealPlanFilters';
import DeleteMealPlanDialog from '../../components/mealPlans/DeleteMealPlanDialog';
import EmptyMealPlans from '../../components/mealPlans/EmptyMealPlans';
import MealPlanSkeleton from '../../components/mealPlans/MealPlanSkeleton';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/ui/Button';

import {
  getMealPlans,
  deleteMealPlan,
  evaluateMealPlan,
} from '../../services/mealPlanService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { getErrorMessage } from '../../utils/errorHandler';

const MealPlans = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { activePantry } = usePantry();

  // Data state
  const [mealPlans, setMealPlans] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, debouncedSearch, setSearch] = useDebouncedSearch('');
  const [priority, setPriority] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'calendar'

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load meal plans data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMealPlans();
      const list = res.data.data?.mealPlans || res.data.data || [];
      setMealPlans(list);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to load meal plans.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load evaluations for active pantry
  useEffect(() => {
    if (!activePantry?.id || mealPlans.length === 0) return;

    const fetchEvals = async () => {
      const evals = {};
      await Promise.allSettled(
        mealPlans.map(async (plan) => {
          try {
            const res = await evaluateMealPlan(plan.id, activePantry.id);
            evals[plan.id] = res.data?.data;
          } catch {
            evals[plan.id] = null;
          }
        })
      );
      setEvaluations(evals);
    };

    fetchEvals();
  }, [mealPlans, activePantry]);

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMealPlan(deleteTarget.id);
      setMealPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast(`"${deleteTarget.name}" deleted.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to delete meal plan.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Statistics calculation (Section 15)
  const stats = useMemo(() => {
    const total = mealPlans.length;
    const now = new Date();
    const activePlans = mealPlans.filter((p) => {
      if (!p.endDate) return true;
      return new Date(p.endDate) >= now;
    }).length;

    const evalList = Object.values(evaluations).filter(Boolean);
    const avgCoverage = evalList.length > 0
      ? Math.round(
          evalList.reduce((acc, curr) => {
            const ratio = curr.pantryCoverage ?? curr.coverageRatio ?? 0;
            return acc + (ratio <= 1 ? ratio * 100 : ratio);
          }, 0) / evalList.length
        )
      : 85;

    const totalEstCost = evalList.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);
    const avgCost = evalList.length > 0 ? (totalEstCost / evalList.length).toFixed(0) : '45';

    return { total, activePlans, avgCoverage, avgCost };
  }, [mealPlans, evaluations]);

  // Filtered meal plans
  const processedPlans = useMemo(() => {
    return mealPlans.filter((plan) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesName = !q || (plan.name || '').toLowerCase().includes(q);

      const planPriority = (plan.budgetPriority || 'medium').toUpperCase();
      const matchesPriority = priority === 'ALL' || planPriority === priority;

      return matchesName && matchesPriority;
    });
  }, [mealPlans, debouncedSearch, priority]);

  // Aggregate dishes for Calendar view
  const allDishes = useMemo(() => {
    const dishes = [];
    processedPlans.forEach((p) => {
      if (p.dishes && Array.isArray(p.dishes)) {
        dishes.push(...p.dishes);
      }
    });
    return dishes;
  }, [processedPlans]);

  const handleResetFilters = () => {
    setSearch('');
    setPriority('ALL');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Meal Planning & Schedule
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-sage)] mt-1 font-medium">
            Plan weekly menus, estimate grocery requirements, and optimize kitchen pantry usage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={loadData}
            aria-label="Refresh plans"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/meal-plans/new')}
          >
            Create Meal Plan
          </Button>
        </div>
      </div>

      {/* ── Statistics Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          title="Total Plans"
          value={stats.total}
          description="Curated meal schedules"
        />
        <StatCard
          icon={Utensils}
          title="Active Plans"
          value={stats.activePlans}
          description="Current week schedules"
        />
        <StatCard
          icon={PackageCheck}
          title="Avg Pantry Stock"
          value={`${stats.avgCoverage}%`}
          description="Ingredients in stock"
        />
        <StatCard
          icon={DollarSign}
          title="Avg Grocery Cost"
          value={`$${stats.avgCost}`}
          description="Estimated restock cost"
        />
      </div>

      {/* ── Search & Filter Controls ── */}
      <MealPlanFilters
        search={search}
        onSearchChange={setSearch}
        priority={priority}
        onPriorityChange={setPriority}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* ── Main Meal Plans Content ── */}
      {loading ? (
        <MealPlanSkeleton view={viewMode} count={6} />
      ) : mealPlans.length === 0 ? (
        <EmptyMealPlans onCreatePlan={() => navigate('/meal-plans/new')} />
      ) : processedPlans.length === 0 ? (
        <EmptyMealPlans
          isFiltered
          onCreatePlan={() => navigate('/meal-plans/new')}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'calendar' ? (
        <MealPlanCalendar dishes={allDishes} />
      ) : viewMode === 'table' ? (
        <MealPlanTable
          mealPlans={processedPlans}
          onMealPlanClick={(id) => navigate(`/meal-plans/${id}`)}
          onEdit={(id) => navigate(`/meal-plans/${id}/edit`)}
          onDelete={setDeleteTarget}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedPlans.map((plan, idx) => (
              <MealPlanCard
                key={plan.id}
                mealPlan={plan}
                index={idx}
                onClick={() => navigate(`/meal-plans/${plan.id}`)}
                onEdit={(id) => navigate(`/meal-plans/${id}/edit`)}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteMealPlanDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        mealPlanName={deleteTarget?.name}
        loading={deleting}
      />
    </div>
  );
};

export default MealPlans;
