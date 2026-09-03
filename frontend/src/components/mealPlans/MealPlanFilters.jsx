import React from 'react';
import { LayoutGrid, List, Calendar as CalendarIcon, Search, X } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'ALL',    label: 'All Priorities' },
  { value: 'HIGH',   label: 'High Priority' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low' },
];

const MealPlanFilters = ({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search meal plans by title..."
            aria-label="Search meal plans"
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-[rgba(138,144,112,0.20)] rounded-xl text-sm text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[rgba(138,144,112,0.15)] transition-all shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Priority Filter & View Mode Switcher */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Priority Select */}
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            aria-label="Filter by priority"
            className="px-3 py-2 bg-white border border-[rgba(138,144,112,0.18)] rounded-xl text-xs font-semibold text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-sage)] transition-colors shadow-sm cursor-pointer"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View Switcher (Grid, Table, Calendar) */}
          <div className="flex items-center bg-white border border-[rgba(138,144,112,0.18)] rounded-xl p-0.5 shadow-sm">
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
            <button
              type="button"
              onClick={() => onViewModeChange('calendar')}
              aria-label="Calendar weekly schedule view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-sage)] hover:text-[var(--color-dark)]'
              }`}
            >
              <CalendarIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanFilters;
