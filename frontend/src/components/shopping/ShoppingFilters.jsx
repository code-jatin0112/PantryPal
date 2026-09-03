import React from 'react';
import { LayoutGrid, List, ArrowDownAZ } from 'lucide-react';
import { PANTRY_CATEGORIES } from '../../constants/api';

const STATUS_FILTERS = [
  { value: 'ALL',       label: 'All Items' },
  { value: 'PENDING',   label: 'To Buy' },
  { value: 'PURCHASED', label: 'Purchased' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL',    label: 'All Priorities' },
  { value: 'HIGH',   label: 'High Priority' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low' },
];

const SORT_OPTIONS = [
  { value: 'newest',        label: 'Recently Added' },
  { value: 'name_asc',      label: 'Alphabetical (A-Z)' },
  { value: 'name_desc',     label: 'Alphabetical (Z-A)' },
  { value: 'priority_desc', label: 'Highest Priority' },
  { value: 'quantity_desc', label: 'Highest Quantity' },
];

const ShoppingFilters = ({
  status,
  onStatusChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  categories = ['All', ...PANTRY_CATEGORIES],
}) => {
  return (
    <div className="space-y-4">
      {/* Top Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs & Priority Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {STATUS_FILTERS.map((tab) => {
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--color-sage)] text-white shadow-sm'
                    : 'bg-white border border-[rgba(138,144,112,0.18)] text-[var(--color-bark)] hover:bg-[var(--color-parchment)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-[rgba(138,144,112,0.2)] mx-1" />

          {/* Priority Quick Select */}
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            aria-label="Filter by priority"
            className="px-2.5 py-1.5 bg-white border border-[rgba(138,144,112,0.18)] rounded-xl text-xs font-semibold text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-sage)] transition-colors shadow-sm cursor-pointer"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
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
              aria-label="Sort shopping list items"
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

      {/* Category Pills */}
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

export default ShoppingFilters;
