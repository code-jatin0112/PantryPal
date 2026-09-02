import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, Clock, Flame } from 'lucide-react';
import SectionCard from './SectionCard';
import Badge from '../ui/Badge';

const MealPlanPreview = ({ meals = [] }) => {
  const getMealBadgeVariant = (type) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'warning';
      case 'lunch':
        return 'info';
      case 'dinner':
        return 'neutral';
      case 'snack':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <SectionCard
      icon={CalendarDays}
      title="Today's Meal Plan"
      subtitle="Scheduled dishes and nutritional targets"
      action={
        <Link
          to="/meal-planner"
          className="text-xs font-semibold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors flex items-center gap-1"
        >
          <span>Planner</span>
          <ArrowRight size={13} />
        </Link>
      }
    >
      {meals.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--color-sage)]">
          No meals planned for today. Click Planner to schedule your day.
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.id || meal.type}
              className="p-3.5 rounded-xl border border-[rgba(138,144,112,0.15)] bg-[var(--color-parchment)] hover:bg-white hover:border-[var(--color-sage)] transition-all flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getMealBadgeVariant(meal.type)} size="sm">
                    {meal.type}
                  </Badge>
                  <span className="text-[11px] text-[var(--color-sage)] flex items-center gap-1 font-medium">
                    <Clock size={11} />
                    {meal.time}
                  </span>
                </div>

                <p className="text-sm font-bold text-[var(--color-dark)] truncate">
                  {meal.recipeName}
                </p>
              </div>

              {meal.calories && (
                <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-bark)] bg-white px-2.5 py-1 rounded-lg border border-[rgba(138,144,112,0.15)] flex-shrink-0">
                  <Flame size={12} className="text-amber-500" />
                  <span>{meal.calories}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default MealPlanPreview;
