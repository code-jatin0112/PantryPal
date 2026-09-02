import React from 'react';
import { History, Pin, X, Trash2, Search } from 'lucide-react';

const RecentSearches = ({
  recentSearches = [],
  onSelectSearch,
  onRemoveSearch,
  onTogglePin,
  onClearAll,
}) => {
  if (!recentSearches || recentSearches.length === 0) return null;

  return (
    <div className="space-y-2.5 text-left">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider flex items-center gap-1.5">
          <History size={13} className="text-[var(--color-sage)]" />
          <span>Recent & Pinned Searches</span>
        </h3>

        {recentSearches.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-bold text-[var(--color-sage)] hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 size={11} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {recentSearches.map((item) => {
          const queryText = typeof item === 'string' ? item : item.query;
          const isPinned = typeof item === 'object' ? item.isPinned : false;

          return (
            <div
              key={queryText}
              onClick={() => onSelectSearch(queryText)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none group shadow-xs ${
                isPinned
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                  : 'bg-white border-[rgba(138,144,112,0.18)] text-[var(--color-dark)] hover:border-[var(--color-sage)] hover:bg-[var(--color-parchment)]'
              }`}
            >
              <Search size={12} className="text-[var(--color-sage)]" />
              <span>{queryText}</span>

              {/* Pin Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin?.(queryText);
                }}
                aria-label={isPinned ? 'Unpin search' : 'Pin search'}
                className={`p-0.5 rounded hover:scale-110 transition-transform ${
                  isPinned ? 'text-amber-500' : 'text-[var(--color-sage)] opacity-0 group-hover:opacity-100'
                }`}
              >
                <Pin size={11} fill={isPinned ? 'currentColor' : 'none'} />
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSearch?.(queryText);
                }}
                aria-label="Remove search"
                className="p-0.5 rounded text-[var(--color-sage)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentSearches;
