import React from 'react';
import { Activity, Flame, PieChart } from 'lucide-react';

const NutritionCard = ({ nutrition = null, servings = 1 }) => {
  if (!nutrition) {
    return (
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[rgba(138,144,112,0.10)]">
          <Activity size={16} className="text-[var(--color-sage)]" />
          <h3 className="text-sm font-bold text-[var(--color-dark)]">Nutrition Information</h3>
        </div>
        <p className="text-xs text-[var(--color-sage)]">No nutrition data available for this recipe.</p>
      </div>
    );
  }

  const nutrients = [
    { label: 'Calories', value: nutrition.calories ? `${Math.round(nutrition.calories)} kcal` : '—', icon: Flame, color: 'text-amber-600 bg-amber-50' },
    { label: 'Protein',  value: nutrition.protein ? `${nutrition.protein}g` : '—', icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Carbs',    value: nutrition.carbohydrates ? `${nutrition.carbohydrates}g` : '—', icon: PieChart, color: 'text-blue-600 bg-blue-50' },
    { label: 'Fat',      value: nutrition.fat ? `${nutrition.fat}g` : '—', icon: Activity, color: 'text-orange-600 bg-orange-50' },
    { label: 'Fiber',    value: nutrition.fiber ? `${nutrition.fiber}g` : '—', icon: Activity, color: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.10)]' },
    { label: 'Sugar',    value: nutrition.sugar ? `${nutrition.sugar}g` : '—', icon: Activity, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
              Nutritional Profile
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">Estimated per serving</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {nutrients.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.12)] flex flex-col justify-between gap-1"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-[var(--color-sage)] uppercase tracking-wider">
                  {item.label}
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${item.color}`}>
                  <Icon size={11} />
                </div>
              </div>
              <p className="text-base font-extrabold text-[var(--color-dark)] tabular-nums mt-1">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NutritionCard;
