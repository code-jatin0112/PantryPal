import React from 'react';
import { Calendar, Users, Utensils, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';

const MealPlanTable = ({
  mealPlans = [],
  onMealPlanClick,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.15)] text-[11px] font-bold text-[var(--color-sage)] uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-5">Meal Plan Name</th>
              <th scope="col" className="py-3.5 px-4">Date Range</th>
              <th scope="col" className="py-3.5 px-4">Meals</th>
              <th scope="col" className="py-3.5 px-4">People</th>
              <th scope="col" className="py-3.5 px-4">Budget</th>
              <th scope="col" className="py-3.5 px-4">Priority</th>
              <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(138,144,112,0.10)] text-sm">
            {mealPlans.map((plan) => {
              const name = plan.name || 'Untitled Plan';
              const startDate = plan.startDate ? new Date(plan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
              const endDate = plan.endDate ? new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
              const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate || '—';
              const dishesCount = plan.dishes?.length ?? plan._count?.dishes ?? plan.mealCount ?? 0;
              const priority = (plan.budgetPriority || 'medium').toLowerCase();

              const priorityVariant =
                priority === 'high' ? 'danger' : priority === 'low' ? 'neutral' : 'warning';

              return (
                <tr
                  key={plan.id}
                  onClick={() => onMealPlanClick(plan.id)}
                  className="hover:bg-[var(--color-parchment)] transition-colors cursor-pointer group"
                >
                  {/* Name */}
                  <td className="py-3.5 px-5 font-bold text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors">
                    {name}
                  </td>

                  {/* Date Range */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-sage)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{dateRange}</span>
                    </div>
                  </td>

                  {/* Meals */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-dark)] tabular-nums">
                    {dishesCount} dishes
                  </td>

                  {/* People */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-sage)] tabular-nums">
                    {plan.peopleCount || 2} persons
                  </td>

                  {/* Budget */}
                  <td className="py-3.5 px-4 font-bold text-[var(--color-dark)] tabular-nums text-xs">
                    {plan.budget ? `$${Number(plan.budget).toFixed(0)}` : 'Flexible'}
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <Badge variant={priorityVariant} size="sm">
                      {priority.toUpperCase()}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(plan.id)}
                          aria-label={`Edit ${name}`}
                          className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(plan)}
                          aria-label={`Delete ${name}`}
                          className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <ChevronRight size={15} className="text-[var(--color-sage)] group-hover:translate-x-1 transition-transform ml-1" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MealPlanTable;
