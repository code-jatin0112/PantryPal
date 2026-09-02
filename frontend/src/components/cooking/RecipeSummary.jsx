import React from 'react';
import { ChefHat, Clock, Users, Flame } from 'lucide-react';
import Badge from '../ui/Badge';

const RecipeSummary = ({ recipe }) => {
  if (!recipe) return null;

  const prepTime = recipe.prepTime || 15;
  const cookTime = recipe.cookTime || 25;
  const totalTime = prepTime + cookTime;
  const servings = recipe.servings || 4;
  const cuisine = recipe.cuisine || recipe.cuisineType || 'Indian';
  const calories = recipe.nutrition?.calories || 480;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-3">
      <div className="flex items-center gap-2 pb-2.5 border-b border-[rgba(138,144,112,0.10)]">
        <div className="w-7 h-7 rounded-lg bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
          <ChefHat size={15} />
        </div>
        <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
          Recipe Snapshot
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl space-y-0.5">
          <div className="flex items-center gap-1 text-[var(--color-sage)] font-semibold">
            <Clock size={12} />
            <span>Total Time</span>
          </div>
          <p className="font-extrabold text-[var(--color-dark)] tabular-nums">{totalTime} mins</p>
        </div>

        <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl space-y-0.5">
          <div className="flex items-center gap-1 text-[var(--color-sage)] font-semibold">
            <Users size={12} />
            <span>Yields</span>
          </div>
          <p className="font-extrabold text-[var(--color-dark)] tabular-nums">{servings} portions</p>
        </div>

        <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl space-y-0.5">
          <div className="flex items-center gap-1 text-[var(--color-sage)] font-semibold">
            <Flame size={12} className="text-amber-500" />
            <span>Calories</span>
          </div>
          <p className="font-extrabold text-[var(--color-dark)] tabular-nums">{Math.round(calories)} kcal</p>
        </div>

        <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl space-y-0.5">
          <span className="text-[var(--color-sage)] font-semibold block">Cuisine</span>
          <p className="font-extrabold text-[var(--color-dark)] truncate">{cuisine}</p>
        </div>
      </div>
    </div>
  );
};

export default RecipeSummary;
