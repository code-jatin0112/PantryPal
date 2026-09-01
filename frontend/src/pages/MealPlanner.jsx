import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../context/ToastContext';
import {
  getMealPlans, createMealPlan, deleteMealPlan,
  getMealPlanById, addDish, deleteDish, getGroceryRequirements
} from '../services/mealPlanService';
import { getRecipes } from '../services/recipeService';
import {
  CalendarDays, Plus, Trash2, X, ChefHat, ShoppingCart,
  Loader2, Clock, CheckCircle2, FileText, ChevronRight,
  AlertCircle, Utensils
} from 'lucide-react';

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    DRAFT:     'bg-amber-100 text-amber-700',
    ACTIVE:    'bg-green-100 text-green-700',
    COMPLETED: 'bg-sage/20 text-sage',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-sage/20 text-sage'}`}>
      {status}
    </span>
  );
};

// ─── Create Plan Modal ─────────────────────────────────────────────────────────
const CreatePlanModal = ({ onClose, onCreated }) => {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate:   new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data) => {
    try {
      const res = await createMealPlan({ name: data.name, startDate: data.startDate, endDate: data.endDate });
      toast(`Meal plan "${data.name}" created!`, 'success');
      onCreated(res.data.data.mealPlan);
      onClose();
    } catch {
      toast('Failed to create meal plan.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-bark">New Meal Plan</h2>
          <button onClick={onClose} className="text-sage hover:text-bark transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Plan Name</label>
            <input {...register('name', { required: 'Name is required' })}
              className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
              placeholder="e.g. This Week's Meals"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Start Date</label>
              <input type="date" {...register('startDate', { required: true })}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-bark mb-1">End Date</label>
              <input type="date" {...register('endDate', { required: true })}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-sage/30 text-sage font-medium text-sm hover:bg-sage/10 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-sage text-white font-medium text-sm hover:bg-bark transition-colors disabled:opacity-60">
              {isSubmitting ? 'Creating…' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Grocery List Modal ────────────────────────────────────────────────────────
const GroceryModal = ({ mealPlanId, pantryId, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroceryRequirements(mealPlanId, { pantryId })
      .then(r => setItems(r.data.data?.groceryItems || r.data.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [mealPlanId, pantryId]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-sage/20">
          <h2 className="font-bold text-bark flex items-center gap-2">
            <ShoppingCart size={18} className="text-sage" /> Grocery Requirements
          </h2>
          <button onClick={onClose} className="text-sage hover:text-bark transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sage py-4 justify-center">
              <Loader2 size={18} className="animate-spin" /> Calculating…
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 size={36} className="mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-bark">You have everything you need!</p>
              <p className="text-sage text-sm mt-1">Your pantry covers this entire meal plan.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-sage/10 last:border-0 text-sm">
                  <span className="text-bark font-medium">{item.name || item.ingredientName}</span>
                  <span className="text-sage">{item.requiredQuantity || item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Plan Detail Panel ─────────────────────────────────────────────────────────
const PlanDetail = ({ planId, recipes, onDishAdded, onDishDeleted }) => {
  const toast = useToast();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddDish, setShowAddDish] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [mealType, setMealType] = useState('DINNER');
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [adding, setAdding] = useState(false);
  const [showGrocery, setShowGrocery] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMealPlanById(planId);
      setPlan(res.data.data.mealPlan);
    } catch {
      toast('Failed to load plan details.', 'error');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const handleAddDish = async () => {
    if (!selectedRecipeId) return;
    setAdding(true);
    try {
      await addDish(planId, { recipeId: selectedRecipeId, mealType, plannedDate });
      toast('Dish added to plan!', 'success');
      setShowAddDish(false);
      load();
      onDishAdded?.();
    } catch {
      toast('Failed to add dish.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDish = async (dishId, dishName) => {
    try {
      await deleteDish(planId, dishId);
      toast(`"${dishName}" removed from plan.`, 'info');
      load();
      onDishDeleted?.();
    } catch {
      toast('Failed to remove dish.', 'error');
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-sage" />
    </div>
  );

  if (!plan) return null;

  // Group dishes by date
  const byDate = (plan.dishes || []).reduce((acc, dish) => {
    const d = dish.plannedDate ? dish.plannedDate.split('T')[0] : 'Unscheduled';
    if (!acc[d]) acc[d] = [];
    acc[d].push(dish);
    return acc;
  }, {});

  const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Plan Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-bark">{plan.name}</h2>
          <p className="text-sage text-sm mt-0.5">
            {new Date(plan.startDate).toLocaleDateString()} – {new Date(plan.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGrocery(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-sage/30 text-sage hover:text-bark hover:border-bark transition-colors text-sm font-medium">
            <ShoppingCart size={15} /> Grocery List
          </button>
          <button onClick={() => setShowAddDish(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sage text-white hover:bg-bark transition-colors text-sm font-medium">
            <Plus size={15} /> Add Dish
          </button>
        </div>
      </div>

      {/* Add Dish Panel */}
      {showAddDish && (
        <div className="bg-olive/10 border border-olive/30 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-bark text-sm">Add a Dish</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-sage/30 text-sm bg-white focus:border-olive outline-none">
              <option value="">Select recipe…</option>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select value={mealType} onChange={e => setMealType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-sage/30 text-sm bg-white focus:border-olive outline-none">
              {mealTypes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-sage/30 text-sm bg-white focus:border-olive outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddDish(false)}
              className="px-4 py-2 rounded-xl border border-sage/30 text-sage text-sm hover:bg-sage/10 transition-colors">Cancel</button>
            <button onClick={handleAddDish} disabled={!selectedRecipeId || adding}
              className="px-4 py-2 rounded-xl bg-sage text-white text-sm hover:bg-bark transition-colors disabled:opacity-60 flex items-center gap-2">
              {adding && <Loader2 size={14} className="animate-spin" />} Add to Plan
            </button>
          </div>
        </div>
      )}

      {/* Dishes by Date */}
      {Object.keys(byDate).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sage/20">
          <Utensils size={40} className="mx-auto text-olive mb-3" />
          <p className="text-bark font-semibold mb-1">No dishes planned yet</p>
          <p className="text-sage text-sm">Click "Add Dish" to start filling this meal plan.</p>
        </div>
      ) : (
        Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dishes]) => (
          <div key={date} className="bg-white rounded-2xl border border-sage/20 overflow-hidden">
            <div className="px-5 py-3 bg-parchment border-b border-sage/10 flex items-center gap-2">
              <CalendarDays size={15} className="text-sage" />
              <span className="font-semibold text-bark text-sm">
                {date === 'Unscheduled' ? 'Unscheduled' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="ml-auto text-xs text-sage">{dishes.length} dish{dishes.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="divide-y divide-sage/10">
              {dishes.map(dish => (
                <div key={dish.id} className="flex items-center justify-between px-5 py-3 group hover:bg-parchment/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      dish.mealType === 'BREAKFAST' ? 'bg-amber-100 text-amber-700' :
                      dish.mealType === 'LUNCH'     ? 'bg-blue-100 text-blue-700'   :
                      dish.mealType === 'DINNER'    ? 'bg-purple-100 text-purple-700':
                      'bg-sage/20 text-sage'
                    }`}>{dish.mealType}</span>
                    <span className="text-sm font-medium text-bark">{dish.recipe?.name || 'Unknown Recipe'}</span>
                    {dish.recipe?.prepTime && (
                      <span className="text-xs text-sage flex items-center gap-1">
                        <Clock size={11} /> {dish.recipe.prepTime}m
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteDish(dish.id, dish.recipe?.name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-sage hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showGrocery && (
        <GroceryModal
          mealPlanId={planId}
          pantryId={null}
          onClose={() => setShowGrocery(false)}
        />
      )}
    </div>
  );
};

// ─── Main Meal Planner Page ────────────────────────────────────────────────────
const MealPlanner = () => {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, recipeRes] = await Promise.all([getMealPlans(), getRecipes()]);
      const planList = planRes.data.data.mealPlans || [];
      setPlans(planList);
      setRecipes(recipeRes.data.data.recipes || []);
      if (planList.length > 0 && !selectedPlanId) {
        setSelectedPlanId(planList[0].id);
      }
    } catch {
      toast('Failed to load meal plans.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (planId, planName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${planName}"? This cannot be undone.`)) return;
    try {
      await deleteMealPlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
      if (selectedPlanId === planId) setSelectedPlanId(null);
      toast(`"${planName}" deleted.`, 'info');
    } catch {
      toast('Failed to delete plan.', 'error');
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Left Sidebar: Plan List ── */}
      <div className="w-72 flex-shrink-0 border-r border-sage/20 bg-white flex flex-col">
        <div className="p-5 border-b border-sage/20 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-bark">Meal Plans</h1>
            <p className="text-xs text-sage mt-0.5">{plans.length} plans</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="w-8 h-8 bg-sage hover:bg-bark text-white rounded-xl flex items-center justify-center transition-colors">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-sage/10 rounded-xl animate-pulse" />
            ))
          ) : plans.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CalendarDays size={36} className="mx-auto text-olive mb-3" />
              <p className="text-bark font-semibold text-sm mb-1">No meal plans yet</p>
              <p className="text-sage text-xs">Create your first plan to get started.</p>
            </div>
          ) : (
            plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`group p-3.5 rounded-xl cursor-pointer transition-all border ${
                  selectedPlanId === plan.id
                    ? 'bg-bark text-white border-bark'
                    : 'border-transparent hover:bg-parchment hover:border-sage/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${selectedPlanId === plan.id ? 'text-white' : 'text-bark'}`}>
                      {plan.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${selectedPlanId === plan.id ? 'text-white/70' : 'text-sage'}`}>
                      {new Date(plan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                      {new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StatusBadge status={plan.status} />
                    <button
                      onClick={(e) => handleDelete(plan.id, plan.name, e)}
                      className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                        selectedPlanId === plan.id ? 'hover:bg-white/20 text-white/70' : 'hover:bg-red-50 text-sage hover:text-red-500'
                      }`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Plan Detail ── */}
      <div className="flex-1 bg-parchment flex flex-col overflow-hidden">
        {selectedPlanId ? (
          <PlanDetail
            key={selectedPlanId}
            planId={selectedPlanId}
            recipes={recipes}
            onDishAdded={() => {}}
            onDishDeleted={() => {}}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-20 h-20 bg-olive/20 rounded-2xl flex items-center justify-center">
              <CalendarDays size={36} className="text-bark" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-bark mb-2">Select a Meal Plan</h2>
              <p className="text-sage text-sm max-w-xs">Choose a plan from the sidebar to view and manage your weekly meals, or create a new one.</p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-3 bg-sage text-white rounded-xl hover:bg-bark transition-colors font-medium">
              <Plus size={18} /> Create New Plan
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreatePlanModal
          onClose={() => setShowCreate(false)}
          onCreated={(plan) => {
            setPlans(prev => [plan, ...prev]);
            setSelectedPlanId(plan.id);
          }}
        />
      )}
    </div>
  );
};

export default MealPlanner;
