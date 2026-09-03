import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const SUGGESTED_QUERIES = [
  'Butter Chicken',
  'Olive Oil',
  'Mediterranean Plan',
  'Quinoa Bowl',
  'Whole Milk',
  'High Protein',
];

const SearchEmptyState = ({ query = '', onSelectSuggestion, onClear }) => {
  return (
    <div className="py-8 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center shadow-xs">
        <Search size={26} />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-[var(--color-dark)]">
          {query ? `No matches found for "${query}"` : 'No results found'}
        </h3>
        <p className="text-xs text-[var(--color-sage)] font-medium leading-relaxed">
          Try checking for spelling errors, using more general keywords, or explore common searches below.
        </p>
      </div>

      {/* Suggested Query Chips */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider block">
          Popular Suggestions
        </span>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {SUGGESTED_QUERIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelectSuggestion(s)}
              className="px-2.5 py-1 rounded-xl bg-white border border-[rgba(138,144,112,0.2)] text-xs font-bold text-[var(--color-bark)] hover:bg-[var(--color-parchment)] transition-all shadow-xs"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {onClear && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onClear} className="text-xs font-bold">
            Clear Search Filter
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchEmptyState;
