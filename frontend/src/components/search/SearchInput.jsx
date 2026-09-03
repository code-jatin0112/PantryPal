import React from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search recipes, pantry items, meal plans, shopping lists...',
  autoFocus = true,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search
        size={18}
        className="absolute left-4 text-[var(--color-sage)] pointer-events-none"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search all kitchen items"
        className="w-full pl-11 pr-20 py-3.5 bg-[var(--color-parchment)]/70 border border-[rgba(138,144,112,0.20)] rounded-2xl text-sm sm:text-base text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[rgba(138,144,112,0.15)] transition-all font-medium shadow-xs"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search input"
          className="absolute right-4 p-1 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-black/5 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
