import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Trash2, ArrowUp, ArrowDown, ChefHat, Sparkles, Activity } from 'lucide-react';
import Button from '../ui/Button';
import { CUISINE_OPTIONS, PANTRY_UNITS } from '../../constants/api';

const recipeSchema = z.object({
  title: z.string().trim().min(1, 'Recipe title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().trim().max(500, 'Description must be under 500 characters').optional(),
  cuisine: z.string().optional(),
  category: z.string().optional(),
  prepTime: z.number().nonnegative().optional(),
  cookTime: z.number().nonnegative().optional(),
  servings: z.number().int().min(1, 'Must serve at least 1 person'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

const RecipeForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Save Recipe',
}) => {
  const [instructions, setInstructions] = useState(
    Array.isArray(initialData?.instructions)
      ? initialData.instructions.map((s) => (typeof s === 'string' ? s : s.description || ''))
      : initialData?.instructions
      ? String(initialData.instructions).split('\n').filter(Boolean)
      : ['Prepare ingredients.', 'Cook according to recipe instructions.']
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData?.title || initialData?.name || '',
      description: initialData?.description || '',
      cuisine: initialData?.cuisine || initialData?.cuisineType || 'Italian',
      category: initialData?.category || 'Dinner',
      prepTime: initialData?.prepTime !== undefined ? initialData.prepTime : 15,
      cookTime: initialData?.cookTime !== undefined ? initialData.cookTime : 25,
      servings: initialData?.servings !== undefined ? initialData.servings : 4,
      difficulty: initialData?.difficulty || 'MEDIUM',
      ingredients: initialData?.ingredients && initialData.ingredients.length > 0
        ? initialData.ingredients.map((ing) => ({
            name: ing.name || '',
            quantity: ing.quantity !== undefined ? ing.quantity : 1,
            unit: ing.unit || 'pcs',
          }))
        : [
            { name: '', quantity: 1, unit: 'pcs' },
            { name: '', quantity: 1, unit: 'pcs' },
          ],
      calories: initialData?.nutrition?.calories || '',
      protein: initialData?.nutrition?.protein || '',
      carbs: initialData?.nutrition?.carbohydrates || '',
      fat: initialData?.nutrition?.fat || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  // Step instruction actions
  const addInstructionStep = () => {
    setInstructions((prev) => [...prev, '']);
  };

  const updateInstructionStep = (index, value) => {
    setInstructions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const removeInstructionStep = (index) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveInstructionStep = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= instructions.length) return;
    setInstructions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const onFormSubmit = (data) => {
    const filteredIngredients = (data.ingredients || [])
      .filter((ing) => ing.name && ing.name.trim())
      .map((ing) => ({
        name: ing.name.trim(),
        quantity: parseFloat(ing.quantity) || 1,
        unit: ing.unit || 'pcs',
      }));

    const formattedInstructions = instructions
      .filter((s) => s && s.trim())
      .join('\n');

    const payload = {
      title: data.title.trim(),
      description: data.description ? data.description.trim() : undefined,
      cuisine: data.cuisine || undefined,
      category: data.category || undefined,
      prepTime: data.prepTime ? parseInt(data.prepTime, 10) : undefined,
      cookTime: data.cookTime ? parseInt(data.cookTime, 10) : undefined,
      servings: data.servings ? parseInt(data.servings, 10) : 2,
      difficulty: data.difficulty || 'MEDIUM',
      instructions: formattedInstructions || 'Follow recipe directions.',
      ingredients: filteredIngredients,
      nutrition: data.calories
        ? {
            calories: parseFloat(data.calories) || undefined,
            protein: parseFloat(data.protein) || undefined,
            carbohydrates: parseFloat(data.carbs) || undefined,
            fat: parseFloat(data.fat) || undefined,
          }
        : undefined,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 text-left" noValidate>
      {/* ── Section 1: Basic Info ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--color-dark)] uppercase tracking-wider border-b border-[rgba(138,144,112,0.12)] pb-2">
          General Details
        </h3>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="recipe-title" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Recipe Title <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="recipe-title"
            type="text"
            placeholder="e.g. Classic Margherita Pizza"
            autoFocus
            className={`input ${errors.title ? 'input-error' : ''}`}
            {...register('title', { required: 'Recipe title is required' })}
          />
          {errors.title && (
            <p className="text-xs font-semibold text-[var(--color-danger)] mt-1">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="recipe-desc" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Description
          </label>
          <textarea
            id="recipe-desc"
            rows={2}
            placeholder="Brief overview or flavor profile of the dish..."
            className="input resize-none py-2"
            {...register('description')}
          />
        </div>

        {/* Cuisine, Category, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Cuisine
            </label>
            <select className="input bg-white cursor-pointer" {...register('cuisine')}>
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Category
            </label>
            <select className="input bg-white cursor-pointer" {...register('category')}>
              {['Dinner', 'Lunch', 'Breakfast', 'Dessert', 'Snack', 'Soup', 'Salad', 'Drink'].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Difficulty
            </label>
            <select className="input bg-white cursor-pointer" {...register('difficulty')}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        {/* Timing & Servings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Prep Time (mins)
            </label>
            <input
              type="number"
              min="0"
              placeholder="15"
              className="input"
              {...register('prepTime', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Cook Time (mins)
            </label>
            <input
              type="number"
              min="0"
              placeholder="25"
              className="input"
              {...register('cookTime', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Servings <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="4"
              className={`input ${errors.servings ? 'input-error' : ''}`}
              {...register('servings', { required: true, min: 1, valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Ingredient Editor ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-[rgba(138,144,112,0.12)] pb-2">
          <h3 className="text-sm font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Ingredients
          </h3>
          <button
            type="button"
            onClick={() => append({ name: '', quantity: 1, unit: 'pcs' })}
            className="text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] flex items-center gap-1 transition-colors"
          >
            <Plus size={14} />
            <span>Add Ingredient</span>
          </button>
        </div>

        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ingredient name"
                className="input flex-1 py-2 text-xs"
                {...register(`ingredients.${idx}.name`)}
              />
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Qty"
                className="input w-20 py-2 text-xs"
                {...register(`ingredients.${idx}.quantity`)}
              />
              <select
                className="input w-24 py-2 text-xs bg-white cursor-pointer"
                {...register(`ingredients.${idx}.unit`)}
              >
                {PANTRY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label="Remove ingredient"
                className="p-2 text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Instruction Editor ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-[rgba(138,144,112,0.12)] pb-2">
          <h3 className="text-sm font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Cooking Instructions
          </h3>
          <button
            type="button"
            onClick={addInstructionStep}
            className="text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] flex items-center gap-1 transition-colors"
          >
            <Plus size={14} />
            <span>Add Step</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {instructions.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-[var(--color-parchment)] p-2.5 rounded-xl border border-[rgba(138,144,112,0.12)]">
              <span className="w-6 h-6 rounded-full bg-[var(--color-sage)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                {idx + 1}
              </span>
              <textarea
                rows={2}
                value={step}
                onChange={(e) => updateInstructionStep(idx, e.target.value)}
                placeholder={`Step ${idx + 1} details...`}
                className="input flex-1 py-1.5 text-xs bg-white resize-none"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveInstructionStep(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Move step up"
                  className="p-1 rounded text-[var(--color-sage)] hover:text-[var(--color-dark)] disabled:opacity-30"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => moveInstructionStep(idx, 1)}
                  disabled={idx === instructions.length - 1}
                  aria-label="Move step down"
                  className="p-1 rounded text-[var(--color-sage)] hover:text-[var(--color-dark)] disabled:opacity-30"
                >
                  <ArrowDown size={12} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeInstructionStep(idx)}
                aria-label="Delete step"
                className="p-1.5 text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Nutrition (Optional) ── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[var(--color-dark)] uppercase tracking-wider border-b border-[rgba(138,144,112,0.12)] pb-2">
          Nutrition Estimates (Per Serving)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">Calories (kcal)</label>
            <input type="number" step="any" placeholder="450" className="input py-2 text-xs" {...register('calories')} />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">Protein (g)</label>
            <input type="number" step="any" placeholder="24" className="input py-2 text-xs" {...register('protein')} />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">Carbs (g)</label>
            <input type="number" step="any" placeholder="48" className="input py-2 text-xs" {...register('carbs')} />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">Fat (g)</label>
            <input type="number" step="any" placeholder="14" className="input py-2 text-xs" {...register('fat')} />
          </div>
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

export default RecipeForm;
