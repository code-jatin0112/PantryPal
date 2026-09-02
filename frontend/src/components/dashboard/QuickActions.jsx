import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookPlus, CalendarPlus, ShoppingBag, Zap } from 'lucide-react';
import Button from '../ui/Button';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Add Pantry Item',
      icon: Plus,
      variant: 'primary',
      onClick: () => navigate('/pantry'),
      description: 'Log new ingredients or groceries',
    },
    {
      label: 'Add Recipe',
      icon: BookPlus,
      variant: 'secondary',
      onClick: () => navigate('/recipes'),
      description: 'Create custom dishes or import',
    },
    {
      label: 'Generate Meal Plan',
      icon: CalendarPlus,
      variant: 'secondary',
      onClick: () => navigate('/meal-planner'),
      description: 'Schedule your weekly menu',
    },
    {
      label: 'Shopping List',
      icon: ShoppingBag,
      variant: 'secondary',
      onClick: () => navigate('/shopping-list'),
      description: 'Review restock grocery list',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
          <Zap size={16} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--color-dark)] leading-tight">
            Quick Actions
          </h2>
          <p className="text-xs text-[var(--color-sage)]">
            Fast shortcuts for daily kitchen management tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-[rgba(138,144,112,0.15)] bg-[var(--color-parchment)] hover:bg-white hover:border-[var(--color-sage)] hover:shadow-sm transition-all flex flex-col justify-between gap-3 group"
          >
            <div>
              <p className="text-sm font-bold text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors">
                {action.label}
              </p>
              <p className="text-[11px] text-[var(--color-sage)] mt-0.5">
                {action.description}
              </p>
            </div>

            <Button
              variant={action.variant}
              size="sm"
              icon={action.icon}
              fullWidth
              onClick={action.onClick}
              className="mt-1"
            >
              {action.label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
