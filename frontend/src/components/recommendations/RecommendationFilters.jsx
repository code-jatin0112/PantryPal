import React from 'react';
import { motion } from 'framer-motion';
import { Filter, RotateCcw } from 'lucide-react';
import { CUISINE_OPTIONS } from '../../constants/api';
import Button from '../ui/Button';

const DIET_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten Free',
  'High Protein',
  'Low Carb',
  'Low Fat',
  'Keto',
];

const MEAL_TYPES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

const TIME_OPTIONS = [
  { value: 'ALL', label: 'Any Time' },
  { value: '15',  label: '<15 mins' },
  { value: '30',  label: '15–30 mins' },
  { value: '60',  label: '30–60 mins' },
  { value: '90',  label: '60+ mins' },
];

const BUDGET_OPTIONS = [
  { value: 'ALL',    label: 'All Budgets' },
  { value: 'low',    label: '$ Low Budget' },
  { value: 'medium', label: '$$ Medium' },
  { value: 'high',   label: '$$$ Gourmet' },
];

const RecommendationFilters = ({
  diet,
  onDietToggle,
  budget,
  onBudgetChange,
  maxTime,
  onMaxTimeChange,
  difficulty,
  onDifficultyChange,
  cuisine,
  onCuisineChange,
  mealType,
  onMealTypeChange,
  onReset,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-5"
    >
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--color-sage)]" />
          <h3 className="text-sm font-bold text-[var(--color-dark)] uppercase tracking-wider">
            AI Recommendation Tuning
          </h3>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={12} />
          <span>Reset All</span>
        </button>
      </div>

      {/* ── Diet Selection Pills ── */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider block">
          Dietary Profile
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {DIET_OPTIONS.map((d) => {
            const isSelected = diet.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDietToggle(d)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[var(--color-dark)] text-white shadow-xs'
                    : 'bg-[var(--color-parchment)] text-[var(--color-bark)] hover:bg-[rgba(138,144,112,0.18)]'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid Filters (Meal Type, Budget, Cook Time, Difficulty, Cuisine) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
        {/* Meal Type */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">
            Meal Type
          </label>
          <select
            value={mealType}
            onChange={(e) => onMealTypeChange(e.target.value)}
            className="input py-1.5 text-xs bg-white cursor-pointer"
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">
            Budget Target
          </label>
          <select
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            className="input py-1.5 text-xs bg-white cursor-pointer"
          >
            {BUDGET_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cooking Time */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">
            Cooking Time
          </label>
          <select
            value={maxTime}
            onChange={(e) => onMaxTimeChange(e.target.value)}
            className="input py-1.5 text-xs bg-white cursor-pointer"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="input py-1.5 text-xs bg-white cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Cuisine */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[var(--color-sage)] uppercase">
            Cuisine
          </label>
          <select
            value={cuisine}
            onChange={(e) => onCuisineChange(e.target.value)}
            className="input py-1.5 text-xs bg-white cursor-pointer"
          >
            <option value="ALL">All Cuisines</option>
            {CUISINE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationFilters;
