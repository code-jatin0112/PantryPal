import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Package,
  Calendar,
  Sparkles,
  ShoppingCart,
  Settings,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    title: 'Create New Recipe',
    desc: 'Add custom recipe with ingredients, prep time & macros',
    icon: Plus,
    to: '/recipes/new',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    title: 'Add Pantry Item',
    desc: 'Track new groceries, quantities & best-by expiry dates',
    icon: Package,
    to: '/pantry/add',
    color: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.12)] border-[rgba(138,144,112,0.25)]',
  },
  {
    title: 'Ask AI Kitchen Assistant',
    desc: 'Get cooking advice, ingredient swaps & recipe ideas',
    icon: Sparkles,
    to: '/ai-chat',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  {
    title: 'Generate Weekly Meal Plan',
    desc: 'Schedule breakfast, lunch & dinner with grocery sync',
    icon: Calendar,
    to: '/meal-plans/new',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    title: 'Open Grocery Shopping List',
    desc: 'View pending items and check off bought ingredients',
    icon: ShoppingCart,
    to: '/shopping-list',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    title: 'Kitchen Settings & Tuning',
    desc: 'Configure diet profiles, units, and notification alerts',
    icon: Settings,
    to: '/settings',
    color: 'text-slate-700 bg-slate-50 border-slate-200',
  },
];

const QuickActions = ({ onNavigate }) => {
  const navigate = useNavigate();

  const handleAction = (to) => {
    if (onNavigate) onNavigate();
    navigate(to);
  };

  return (
    <div className="space-y-3 text-left">
      <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider px-1">
        Quick Kitchen Actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action, idx) => {
          const Icon = action.icon;
          return (
            <div
              key={idx}
              onClick={() => handleAction(action.to)}
              className="p-3.5 rounded-2xl bg-white border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated hover:border-[var(--color-sage)] transition-all cursor-pointer flex items-center justify-between gap-3 group select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs ${action.color}`}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors truncate">
                    {action.title}
                  </h4>
                  <p className="text-[11px] text-[var(--color-sage)] font-medium truncate mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </div>

              <ArrowRight
                size={13}
                className="text-[var(--color-sage)] group-hover:translate-x-0.5 group-hover:text-[var(--color-dark)] transition-all flex-shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
