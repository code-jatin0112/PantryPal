import React from 'react';
import {
  Sparkles,
  BookOpen,
  Package,
  ShoppingCart,
  Calendar,
  Bell,
  Settings,
  Heart,
  History,
  LayoutGrid,
} from 'lucide-react';

const SEARCH_FILTER_CHIPS = [
  { id: 'all',           label: 'All Items',    icon: LayoutGrid },
  { id: 'recipes',       label: 'Recipes',      icon: BookOpen },
  { id: 'pantry',        label: 'Pantry',       icon: Package },
  { id: 'shopping',      label: 'Shopping',     icon: ShoppingCart },
  { id: 'meal_plans',    label: 'Meal Plans',   icon: Calendar },
  { id: 'ai',            label: 'AI & Tips',    icon: Sparkles },
  { id: 'notifications', label: 'Alerts',       icon: Bell },
  { id: 'settings',      label: 'Settings',     icon: Settings },
  { id: 'favorites',     label: 'Favorites',    icon: Heart },
];

const SearchFilters = ({ activeFilter = 'all', onSelectFilter }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
      {SEARCH_FILTER_CHIPS.map((chip) => {
        const Icon = chip.icon;
        const isActive = activeFilter === chip.id;

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelectFilter(chip.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              isActive
                ? 'bg-[var(--color-dark)] text-white shadow-xs'
                : 'bg-white border border-[rgba(138,144,112,0.18)] text-[var(--color-bark)] hover:bg-[var(--color-parchment)]'
            }`}
          >
            <Icon size={12} className={isActive ? 'text-white' : 'text-[var(--color-sage)]'} />
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SearchFilters;
