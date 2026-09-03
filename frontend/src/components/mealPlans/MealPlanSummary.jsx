import React from 'react';
import { Utensils, Users, Clock, Flame, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';

const MealPlanSummary = ({ dishes = [], peopleCount = 2 }) => {
  // Group dishes by mealType
  const grouped = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: [],
  };

  dishes.forEach((d) => {
    const type = d.mealType || 'Dinner';
    if (grouped[type]) {
      grouped[type].push(d);
    } else {
      grouped.Dinner.push(d);
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
          <Utensils size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
            Menu Breakdown
          </h3>
          <p className="text-[11px] text-[var(--color-sage)]">
            {dishes.length} total dish{dishes.length !== 1 ? 'es' : ''} planned for {peopleCount} person{peopleCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(grouped).map(([mealType, items]) => (
          <div
            key={mealType}
            className="p-4 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.10)] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[var(--color-dark)] uppercase tracking-wider">
                {mealType}
              </span>
              <span className="text-[11px] font-semibold text-[var(--color-sage)]">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-[var(--color-sage)] italic py-1">No items scheduled</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((item, idx) => {
                  const title = item.recipe?.title || item.recipeTitle || item.title || 'Selected Recipe';
                  const recipeId = item.recipeId || item.recipe?.id;
                  const servings = item.requestedServings || peopleCount;

                  return (
                    <li
                      key={item.id || idx}
                      className="bg-white p-2.5 rounded-lg border border-[rgba(138,144,112,0.10)] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ChefHat size={13} className="text-[var(--color-sage)] flex-shrink-0" />
                        {recipeId ? (
                          <Link
                            to={`/recipes/${recipeId}`}
                            className="font-bold text-[var(--color-dark)] hover:text-[var(--color-sage)] truncate"
                          >
                            {title}
                          </Link>
                        ) : (
                          <span className="font-bold text-[var(--color-dark)] truncate">{title}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[var(--color-sage)] flex-shrink-0 font-semibold">
                        <Users size={11} />
                        <span>{servings} srv</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlanSummary;
