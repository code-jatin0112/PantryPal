import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Trash2, Calendar, Utensils, Users, IndianRupee } from 'lucide-react';
import Button from '../ui/Button';
import { getRecipes } from '../../services/recipeService';
import { CUISINE_OPTIONS } from '../../constants/api';

const MealPlanForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Save Meal Plan',
}) => {
  const [recipes, setRecipes] = useState([]);

  // Fetch recipes for dish select dropdown
  useEffect(() => {
    getRecipes()
      .then((res) => {
        const list = res.data.data?.recipes || res.data.data || [];
        setRecipes(list);
      })
      .catch(() => {});
  }, []);

  const defaultStart = new Date().toISOString().split('T')[0];
  const defaultEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : defaultStart,
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : defaultEnd,
      peopleCount: initialData?.peopleCount || 2,
      budget: initialData?.budget !== undefined && initialData?.budget !== null ? initialData.budget : '',
      budgetPriority: initialData?.budgetPriority || 'medium',
      dishes: initialData?.dishes && initialData.dishes.length > 0
        ? initialData.dishes.map((d) => ({
            recipeId: d.recipeId || d.recipe?.id || '',
            mealType: d.mealType || 'Dinner',
            plannedDate: d.plannedDate ? new Date(d.plannedDate).toISOString().split('T')[0] : defaultStart,
            requestedServings: d.requestedServings || 2,
            cuisine: d.cuisine || 'General',
            budgetPriority: d.budgetPriority || 'medium',
          }))
        : [
            { recipeId: '', mealType: 'Breakfast', plannedDate: defaultStart, requestedServings: 2, cuisine: 'General', budgetPriority: 'medium' },
            { recipeId: '', mealType: 'Dinner', plannedDate: defaultStart, requestedServings: 2, cuisine: 'General', budgetPriority: 'medium' },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'dishes',
  });

  const onFormSubmit = (data) => {
    // If no recipe is picked for a dish, assign first available or fallback uuid if possible
    const firstRecipeId = recipes[0]?.id;

    const formattedDishes = (data.dishes || []).map((dish) => ({
      recipeId: dish.recipeId || firstRecipeId || '00000000-0000-0000-0000-000000000000',
      mealType: dish.mealType || 'Dinner',
      plannedDate: new Date(dish.plannedDate).toISOString(),
      requestedServings: parseInt(dish.requestedServings, 10) || 2,
      cuisine: dish.cuisine || undefined,
      budgetPriority: (dish.budgetPriority || 'medium').toLowerCase(),
    }));

    const payload = {
      name: data.name.trim(),
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      peopleCount: parseInt(data.peopleCount, 10) || 2,
      budget: data.budget ? parseFloat(data.budget) : undefined,
      dishes: formattedDishes,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 text-left" noValidate>
      {/* ── General Plan Information ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--color-dark)] uppercase tracking-wider border-b border-[rgba(138,144,112,0.12)] pb-2">
          Plan Settings
        </h3>

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="mealplan-name" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Meal Plan Name <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="mealplan-name"
            type="text"
            placeholder="e.g. Weekly Family Meal Plan"
            autoFocus
            className={`input ${errors.name ? 'input-error' : ''}`}
            {...register('name', { required: 'Meal plan name is required' })}
          />
          {errors.name && (
            <p className="text-xs font-semibold text-[var(--color-danger)] mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Date Range & People Count */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Start Date <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="date"
              className="input bg-white cursor-pointer"
              {...register('startDate', { required: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              End Date <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="date"
              className="input bg-white cursor-pointer"
              {...register('endDate', { required: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              People Count <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="2"
              className="input"
              {...register('peopleCount', { required: true, min: 1, valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Budget & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Estimated Budget (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="150"
              className="input"
              {...register('budget')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Budget Priority
            </label>
            <select className="input bg-white cursor-pointer" {...register('budgetPriority')}>
              <option value="low">Low (Economical)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="high">High (Premium / Gourmet)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Dishes & Meals Section ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-[rgba(138,144,112,0.12)] pb-2">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Scheduled Meals & Recipes
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">
              Assign recipes to specific days and meal times
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              append({
                recipeId: recipes[0]?.id || '',
                mealType: 'Dinner',
                plannedDate: defaultStart,
                requestedServings: 2,
                cuisine: 'General',
                budgetPriority: 'medium',
              })
            }
            className="text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] flex items-center gap-1 transition-colors"
          >
            <Plus size={14} />
            <span>Add Meal</span>
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="p-3.5 bg-[var(--color-parchment)] rounded-xl border border-[rgba(138,144,112,0.12)] space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[var(--color-dark)]">
                  Meal #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  aria-label="Remove meal"
                  className="p-1 text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Recipe Selection */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[var(--color-sage)] uppercase">
                    Recipe
                  </label>
                  <select
                    className="input py-1.5 text-xs bg-white cursor-pointer"
                    {...register(`dishes.${idx}.recipeId`)}
                  >
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title || r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Meal Type */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--color-sage)] uppercase">
                    Meal Type
                  </label>
                  <select
                    className="input py-1.5 text-xs bg-white cursor-pointer"
                    {...register(`dishes.${idx}.mealType`)}
                  >
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Planned Date */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--color-sage)] uppercase">
                    Planned Date
                  </label>
                  <input
                    type="date"
                    className="input py-1.5 text-xs bg-white cursor-pointer"
                    {...register(`dishes.${idx}.plannedDate`)}
                  />
                </div>

                {/* Servings */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--color-sage)] uppercase">
                    Servings
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input py-1.5 text-xs"
                    {...register(`dishes.${idx}.requestedServings`)}
                  />
                </div>

                {/* Cuisine */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--color-sage)] uppercase">
                    Cuisine
                  </label>
                  <select
                    className="input py-1.5 text-xs bg-white cursor-pointer"
                    {...register(`dishes.${idx}.cuisine`)}
                  >
                    {['General', ...CUISINE_OPTIONS].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(138,144,112,0.15)]">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default MealPlanForm;
