import React from 'react';
import {
  BookOpen,
  Package,
  Calendar,
  ShoppingCart,
  Sparkles,
  ChefHat,
  Bell,
  Settings,
  ArrowRight,
  Heart,
} from 'lucide-react';
import Badge from '../ui/Badge';

const getCategoryMeta = (cat) => {
  switch (cat) {
    case 'recipes':
      return { icon: BookOpen, label: 'Recipe', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'pantry':
      return { icon: Package, label: 'Pantry Item', color: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.12)] border-[rgba(138,144,112,0.25)]' };
    case 'meal_plans':
      return { icon: Calendar, label: 'Meal Plan', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'shopping':
      return { icon: ShoppingCart, label: 'Shopping List', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'ai':
      return { icon: Sparkles, label: 'AI Intelligence', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'cooking':
      return { icon: ChefHat, label: 'Cooking Mode', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'notifications':
      return { icon: Bell, label: 'Notification', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'settings':
      return { icon: Settings, label: 'Settings', color: 'text-slate-700 bg-slate-50 border-slate-200' };
    default:
      return { icon: BookOpen, label: 'Item', color: 'text-[var(--color-sage)] bg-[var(--color-parchment)] border-[rgba(138,144,112,0.2)]' };
  }
};

const SearchResultCard = ({
  result,
  isSelected = false,
  onClick,
}) => {
  const { icon: Icon, label, color } = getCategoryMeta(result.category);

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-center justify-between gap-3 group ${
        isSelected
          ? 'bg-[var(--color-parchment)] border-[var(--color-sage)] ring-2 ring-[var(--color-sage)]/30 shadow-sm'
          : 'bg-white border-[rgba(138,144,112,0.16)] hover:border-[var(--color-sage)] hover:bg-[var(--color-parchment)]/50 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Category Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs ${color}`}
        >
          <Icon size={18} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors truncate">
              {result.title}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-parchment)] text-[var(--color-bark)] border border-[rgba(138,144,112,0.15)] flex-shrink-0">
              {label}
            </span>
            {result.isFavorite && (
              <Heart size={12} className="text-rose-500 fill-rose-500 flex-shrink-0" />
            )}
          </div>

          <p className="text-xs text-[var(--color-sage)] font-medium truncate">
            {result.subtitle}
          </p>

          {result.metadata && (
            <span className="text-[11px] font-semibold text-[var(--color-bark)] opacity-80 block truncate">
              {result.metadata}
            </span>
          )}
        </div>
      </div>

      {/* Action Arrow */}
      <div className="w-8 h-8 rounded-xl bg-white border border-[rgba(138,144,112,0.18)] flex items-center justify-center text-[var(--color-sage)] group-hover:bg-[var(--color-dark)] group-hover:text-white group-hover:border-[var(--color-dark)] transition-all flex-shrink-0 shadow-xs">
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};

export default SearchResultCard;
