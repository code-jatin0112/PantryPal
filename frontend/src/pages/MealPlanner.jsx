import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import {
  getMealPlans, createMealPlan, deleteMealPlan,
  getMealPlanById, addDish, deleteDish, getGroceryRequirements
} from '../services/mealPlanService';
import { getRecipes } from '../services/recipeService';
import { getErrorMessage } from '../utils/errorHandler';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import {
  CalendarDays, Plus, Trash2, ChefHat, ShoppingCart,
  Clock, CheckCircle2, Utensils,
} from 'lucide-react';

// ── Meal type color map ───────────────────────────────────
const MEAL_COLORS = {
  BREAKFAST: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  LUNCH:     'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  DINNER:    'bg-[rgba(138,104,163,0.12)] text-[#8268A3]',
  SNACK:     'bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)]',
};

// ── Status Badge ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    DRAFT:     'badge-warning',
    ACTIVE:    'badge-success',
    COMPLETED: 'badge-neutral',
  }[status] || 'badge-neutral';
  return <span className={`badge ${styles}`}>{status}</span>;
};

// ── Create Plan Modal ─────────────────────────────────────
const CreatePlanModal = ({ isOpen, onClose, onCreated }) => {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate:   new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data) => {
    try {
      const res = await createMealPlan({ name: data.name, startDate: data.startDate, endDate: data.endDate });
      toast(`Meal plan "${data.name}" created!`, 'success');
      onCreated(res.data.data.mealPlan);
      onClose();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Meal Plan">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-dark)]">Plan Name *</label>
          <input className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g. This Week's Meals"
            {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-dark)]">Start Date</label>
            <input type="date" className="input" {...register('startDate', { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-dark)]">End Date</label>
            <input type="date" className="input" {...register('endDate', { required: true })} />
          </div>
        </div>
        <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
          Create Plan
        </Button>
      </form>
    </Modal>
  );
};

// ── Grocery Modal ─────────────────────────────────────────
const GroceryModal = ({ isOpen, onClose, mealPlanId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getGroceryRequirements(mealPlanId, {})
      .then((r) => setItems(r.data.data?.groceryItems || r.data.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isOpen, mealPlanId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Grocery Requirements" size="sm">
      {loading ? (
        <Spinner center label="Calculating…" />
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 size={40} className="mx-auto text-[var(--color-success)] mb-3" />
          <p className="font-bold text-[var(--color-dark)] mb-1">You have everything!</p>
          <p className="text-sm text-[var(--color-sage)]">Your pantry covers this entire meal plan.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-[rgba(138,144,112,0.10)] last:border-0 text-sm">
              <span className="font-semibold text-[var(--color-dark)]">{item.name || item.ingredientName}</span>
              <span className="text-[var(--color-sage)]">{item.requiredQuantity || item.quantity} {item.unit}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

// ── Plan Detail Panel ─────────────────────────────────────
const PlanDetail = ({ planId, recipes }) => {
  const toast = useToast();
  const [plan, setPlan]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [recipeId, setRecipeId]   = useState('');
  const [mealType, setMealType]   = useState('DINNER');
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [adding, setAdding]       = useState(false);
  const [deleteDishId, setDeleteDishId] = useState(null);
  const [deleteDishName, setDeleteDishName] = useState('');
  const [deleting, setDeleting]   = useState(false);
  const [showGrocery, setShowGrocery] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMealPlanById(planId);
      setPlan(res.data.data.mealPlan);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const handleAddDish = async () => {
    if (!recipeId) return;
    setAdding(true);
    try {
      await addDish(planId, { recipeId, mealType, plannedDate: date });
      toast('Dish added to plan! 🍽️', 'success');
      setShowAdd(false);
      load();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDish = async () => {
    setDeleting(true);
    try {
      await deleteDish(planId, deleteDishId);
      toast(`"${deleteDishName}" removed.`, 'info');
      setDeleteDishId(null);
      load();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!plan) return null;

  const byDate = (plan.dishes || []).reduce((acc, dish) => {
    const d = dish.plannedDate ? dish.plannedDate.split('T')[0] : 'Unscheduled';
    if (!acc[d]) acc[d] = [];
    acc[d].push(dish);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Plan header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-dark)]">{plan.name}</h2>
          <p className="text-sm text-[var(--color-sage)] mt-0.5">
            {new Date(plan.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {new Date(plan.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" icon={ShoppingCart} onClick={() => setShowGrocery(true)}>
            Grocery List
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowAdd(!showAdd)}>
            Add Dish
          </Button>
        </div>
      </div>

      {/* Add dish inline panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="card p-4 space-y-3 border-[rgba(138,144,112,0.25)]"
          >
            <h3 className="text-sm font-bold text-[var(--color-dark)]">Add a Dish</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)}
                className="input py-2.5 px-4 text-sm bg-white">
                <option value="">Select recipe…</option>
                {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}
                className="input py-2.5 px-4 text-sm bg-white">
                {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" size="sm" loading={adding} disabled={!recipeId} onClick={handleAddDish}>
                Add to Plan
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dishes by date */}
      {Object.keys(byDate).length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Utensils}
            title="No dishes planned yet"
            description='Click "Add Dish" to start filling this meal plan.'
            action={{ label: 'Add Dish', icon: Plus, onClick: () => setShowAdd(true) }}
          />
        </div>
      ) : (
        Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dishes]) => (
          <div key={date} className="card overflow-hidden">
            <div className="px-5 py-3 bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.10)] flex items-center gap-2">
              <CalendarDays size={14} className="text-[var(--color-sage)]" />
              <span className="font-bold text-sm text-[var(--color-dark)]">
                {date === 'Unscheduled' ? 'Unscheduled' :
                  new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                }
              </span>
              <span className="ml-auto text-xs text-[var(--color-sage)]">{dishes.length} dish{dishes.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="divide-y divide-[rgba(138,144,112,0.08)]">
              {dishes.map((dish) => (
                <div key={dish.id} className="flex items-center justify-between px-5 py-3.5 group hover:bg-[var(--color-parchment)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${MEAL_COLORS[dish.mealType] || MEAL_COLORS.SNACK}`}>
                      {dish.mealType}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-dark)] truncate">{dish.recipe?.name || 'Unknown Recipe'}</span>
                    {dish.recipe?.prepTime && (
                      <span className="text-xs text-[var(--color-sage)] flex items-center gap-1 flex-shrink-0">
                        <Clock size={11} /> {dish.recipe.prepTime}m
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setDeleteDishId(dish.id); setDeleteDishName(dish.recipe?.name || 'this dish'); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Grocery Modal */}
      <GroceryModal isOpen={showGrocery} onClose={() => setShowGrocery(false)} mealPlanId={planId} />

      {/* Delete dish confirm */}
      <ConfirmDialog
        isOpen={!!deleteDishId}
        onClose={() => setDeleteDishId(null)}
        onConfirm={handleDeleteDish}
        loading={deleting}
        title="Remove dish?"
        description={`"${deleteDishName}" will be removed from this meal plan.`}
        confirmLabel="Remove"
      />
    </div>
  );
};

// ── Main Meal Planner Page ────────────────────────────────
const MealPlanner = () => {
  const toast = useToast();
  const [plans, setPlans]               = useState([]);
  const [recipes, setRecipes]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedPlanId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [deletePlanId, setDeletePlanId] = useState(null);
  const [deletePlanName, setDeletePlanName] = useState('');
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, recipeRes] = await Promise.all([getMealPlans(), getRecipes()]);
      const planList = planRes.data.data.mealPlans || [];
      setPlans(planList);
      setRecipes(recipeRes.data.data.recipes || []);
      if (planList.length > 0 && !selectedPlanId) {
        setSelectedId(planList[0].id);
      }
    } catch {
      toast('Failed to load meal plans.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMealPlan(deletePlanId);
      setPlans((prev) => prev.filter((p) => p.id !== deletePlanId));
      if (selectedPlanId === deletePlanId) setSelectedId(null);
      toast(`"${deletePlanName}" deleted.`, 'info');
      setDeletePlanId(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-60px)] md:h-screen flex overflow-hidden">
      {/* ── Left: Plan List ── */}
      <div className="w-64 lg:w-72 flex-shrink-0 border-r border-[rgba(138,144,112,0.12)] bg-white flex flex-col">
        <div className="p-5 border-b border-[rgba(138,144,112,0.10)] flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[var(--color-dark)]">Meal Plans</h1>
            <p className="text-xs text-[var(--color-sage)] mt-0.5">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-8 h-8 bg-[var(--color-sage)] hover:bg-[var(--color-bark)] text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <Plus size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-[rgba(138,144,112,0.08)] rounded-xl animate-pulse" />
            ))
          ) : plans.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CalendarDays size={32} className="mx-auto text-[var(--color-olive)] mb-3" />
              <p className="font-bold text-sm text-[var(--color-dark)] mb-1">No plans yet</p>
              <p className="text-xs text-[var(--color-sage)]">Create your first plan to get started.</p>
            </div>
          ) : plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedId(plan.id)}
              className={`group p-3.5 rounded-xl cursor-pointer transition-all border ${
                selectedPlanId === plan.id
                  ? 'bg-[var(--color-dark)] border-[var(--color-dark)]'
                  : 'border-transparent hover:bg-[var(--color-parchment)] hover:border-[rgba(138,144,112,0.2)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`font-semibold text-sm truncate ${selectedPlanId === plan.id ? 'text-white' : 'text-[var(--color-dark)]'}`}>
                    {plan.name}
                  </p>
                  <p className={`text-xs mt-0.5 ${selectedPlanId === plan.id ? 'text-white/60' : 'text-[var(--color-sage)]'}`}>
                    {new Date(plan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                    {new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <StatusBadge status={plan.status} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletePlanId(plan.id); setDeletePlanName(plan.name); }}
                    className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                      selectedPlanId === plan.id ? 'hover:bg-white/20 text-white/60' : 'hover:bg-red-50 text-[var(--color-sage)] hover:text-red-500'
                    }`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Detail ── */}
      <div className="flex-1 bg-[var(--color-parchment)] flex flex-col overflow-hidden">
        {selectedPlanId ? (
          <PlanDetail key={selectedPlanId} planId={selectedPlanId} recipes={recipes} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-[rgba(138,144,112,0.12)] flex items-center justify-center">
              <CalendarDays size={36} className="text-[var(--color-sage)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-dark)] mb-2">Select a Meal Plan</h2>
              <p className="text-sm text-[var(--color-sage)] max-w-xs leading-relaxed">
                Choose a plan from the sidebar to view and manage your weekly meals.
              </p>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>
              Create New Plan
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreatePlanModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(plan) => {
          setPlans((prev) => [plan, ...prev]);
          setSelectedId(plan.id);
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletePlanId}
        onClose={() => setDeletePlanId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete meal plan?"
        description={`"${deletePlanName}" and all its dishes will be permanently deleted.`}
        confirmLabel="Delete Plan"
      />
    </div>
  );
};

export default MealPlanner;
