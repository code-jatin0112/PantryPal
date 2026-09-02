import React from 'react';
import { Search, X } from 'lucide-react';

const PantrySearch = ({ value, onChange, placeholder = 'Search by name or category...' }) => {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <Search
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search pantry ingredients"
        className="w-full pl-10 pr-9 py-2.5 bg-white border border-[rgba(138,144,112,0.20)] rounded-xl text-sm text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[rgba(138,144,112,0.15)] transition-all shadow-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default PantrySearch;
