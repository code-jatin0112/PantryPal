import React from 'react';
import { LayoutGrid, List, ArrowDownAZ, Heart } from 'lucide-react';
import { CUISINE_OPTIONS } from '../../constants/api';

const DIFFICULTY_OPTIONS = [
  { value: 'ALL',    label: 'All Difficulties' },
  { value: 'EASY',   label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD',   label: 'Hard' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest Added' },
  { value: 'match_desc', label: 'Pantry Match (%)' },
  { value: 'name_asc',   label: 'Alphabetical (A-Z)' },
  { value: 'name_desc',  label: 'Alphabetical (Z-A)' },
  { value: 'time_asc',   label: 'Shortest Cook Time' },
  { value: 'cal_asc',    label: 'Lowest Calories' },
];

const RecipeFilters = ({
  category,
  onCategoryChange,
  cuisine,
  onCuisineChange,
  difficulty,
  onDifficultyChange,
  onlyFavorites,
  onOnlyFavoritesChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Soup', 'Salad'],
  cuisines = ['All', ...CUISINE_OPTIONS],
}) => {
  return (
    <div className="space-y-4">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Difficulty Tabs & Favorites Toggle */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {/* Favorites Button */}
          <button
            type="button"
            onClick={() => onOnlyFavoritesChange(!onlyFavorites)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              onlyFavorites
                ? 'bg-red-50 border border-red-200 text-red-600 shadow-sm'
                : 'bg-white border border-[rgba(138,144,112,0.18)] text-[var(--color-bark)] hover:bg-[var(--color-parchment)]'
            }`}
          >
            <Heart size={13} fill={onlyFavorites ? 'currentColor' : 'none'} />
            <span>Favorites</span>
          </button>

          <div className="h-4 w-[1px] bg-[rgba(138,144,112,0.2)] mx-1" />

          {DIFFICULTY_OPTIONS.map((opt) => {
            const isActive = difficulty === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDifficultyChange(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--color-sage)] text-white shadow-sm'
                    : 'bg-white border border-[rgba(138,144,112,0.18)] text-[var(--color-bark)] hover:bg-[var(--color-parchment)]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Right Tools: Sort Dropdown & View Mode Switcher */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <ArrowDownAZ
              size={14}
              className="absolute left-3 text-[var(--color-sage)] pointer-events-none"
            />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort recipes"
              className="pl-8 pr-4 py-1.5 bg-white border border-[rgba(138,144,112,0.18)] rounded-xl text-xs font-semibold text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-sage)] transition-colors shadow-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Switcher */}
          <div className="hidden sm:flex items-center bg-white border border-[rgba(138,144,112,0.18)] rounded-xl p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid card view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-sage)] hover:text-[var(--color-dark)]'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              aria-label="Table list view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-sage)] hover:text-[var(--color-dark)]'
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Categories & Cuisines row */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {categories.map((cat) => {
          const isActive = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--color-dark)] text-white font-semibold'
                  : 'bg-[rgba(138,144,112,0.08)] text-[var(--color-bark)] hover:bg-[rgba(138,144,112,0.16)]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RecipeFilters;
