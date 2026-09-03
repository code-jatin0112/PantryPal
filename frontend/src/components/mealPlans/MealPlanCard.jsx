import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, IndianRupee, Utensils, Edit2, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';

const MealPlanCard = ({
  mealPlan,
  onClick,
  onEdit,
  onDelete,
  index = 0,
}) => {
  const name = mealPlan.name || 'Untitled Meal Plan';
  const startDate = mealPlan.startDate ? new Date(mealPlan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const endDate = mealPlan.endDate ? new Date(mealPlan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate || 'Flexible dates';

  const dishesCount = mealPlan.dishes?.length ?? mealPlan._count?.dishes ?? mealPlan.mealCount ?? 0;
  const peopleCount = mealPlan.peopleCount || 2;
  const budget = mealPlan.budget !== undefined && mealPlan.budget !== null ? Number(mealPlan.budget) : null;
  const priority = (mealPlan.budgetPriority || 'medium').toLowerCase();

  const priorityVariant =
    priority === 'high' ? 'danger' : priority === 'low' ? 'neutral' : 'warning';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors line-clamp-1 leading-snug">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-sage)] mt-1">
              <Calendar size={13} />
              <span>{dateRange}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(mealPlan.id)}
                aria-label={`Edit ${name}`}
                className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(mealPlan)}
                aria-label={`Delete ${name}`}
                className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Specs Overview */}
        <div className="my-3 grid grid-cols-2 gap-2 bg-[var(--color-parchment)] p-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-[var(--color-bark)] font-semibold">
            <Utensils size={13} className="text-[var(--color-sage)]" />
            <span>{dishesCount} meal{dishesCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--color-bark)] font-semibold">
            <Users size={13} className="text-[var(--color-sage)]" />
            <span>{peopleCount} person{peopleCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="pt-2 border-t border-[rgba(138,144,112,0.10)] flex items-center justify-between text-xs">
        <Badge variant={priorityVariant} size="sm">
          {priority.toUpperCase()} PRIORITY
        </Badge>

        {budget !== null ? (
          <span className="font-extrabold text-[var(--color-dark)] tabular-nums">
            Budget: ₹{budget.toFixed(0)}
          </span>
        ) : (
          <span className="text-[var(--color-sage)] font-medium">Flexible</span>
        )}
      </div>
    </motion.div>
  );
};

export default MealPlanCard;
