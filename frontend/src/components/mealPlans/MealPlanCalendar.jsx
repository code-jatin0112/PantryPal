import React from 'react';
import { Calendar as CalendarIcon, Clock, Users, ChefHat } from 'lucide-react';
import Badge from '../ui/Badge';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealPlanCalendar = ({ dishes = [], startDate, endDate }) => {
  // Generate days array between startDate and endDate
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);

  const days = [];
  const curr = new Date(start);
  curr.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(23, 59, 59, 999);

  let maxDays = 14;
  while (curr <= endNorm && maxDays > 0) {
    days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
    maxDays--;
  }

  // Map dishes by date ISO (YYYY-MM-DD) and mealType
  const dishMap = {};
  dishes.forEach((d) => {
    const dDate = d.plannedDate ? new Date(d.plannedDate).toISOString().split('T')[0] : 'undated';
    const type = (d.mealType || 'Dinner').toLowerCase();
    if (!dishMap[dDate]) dishMap[dDate] = {};
    if (!dishMap[dDate][type]) dishMap[dDate][type] = [];
    dishMap[dDate][type].push(d);
  });

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
          <CalendarIcon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
            Weekly Schedule & Menus
          </h3>
          <p className="text-[11px] text-[var(--color-sage)]">Planned meals organized by day and meal category</p>
        </div>
      </div>

      <div className="space-y-4">
        {days.map((day) => {
          const dateStr = day.toISOString().split('T')[0];
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
          const monthDay = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayMeals = dishMap[dateStr] || {};

          return (
            <div
              key={dateStr}
              className="p-4 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.12)] space-y-3"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-extrabold text-[var(--color-dark)]">{dayName}</span>
                  <span className="text-xs font-semibold text-[var(--color-sage)]">{monthDay}</span>
                </div>
              </div>

              {/* Meal categories grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {MEAL_TYPES.map((type) => {
                  const typeKey = type.toLowerCase();
                  const matchedDishes = dayMeals[typeKey] || [];

                  return (
                    <div
                      key={type}
                      className="bg-white p-3 rounded-lg border border-[rgba(138,144,112,0.10)] min-h-[70px] flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider block mb-1">
                        {type}
                      </span>

                      {matchedDishes.length === 0 ? (
                        <span className="text-xs text-[var(--color-sage)]/50 italic">No meal set</span>
                      ) : (
                        <div className="space-y-1">
                          {matchedDishes.map((dish, i) => (
                            <div key={dish.id || i} className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-[var(--color-dark)] truncate">
                                {dish.recipe?.title || dish.recipeTitle || dish.title || 'Selected Recipe'}
                              </span>
                              {dish.requestedServings && (
                                <span className="text-[10px] font-semibold text-[var(--color-sage)] tabular-nums flex-shrink-0">
                                  {dish.requestedServings}s
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealPlanCalendar;
