import React from 'react';

const SearchCategory = ({ title, count, children }) => {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-[11px] font-semibold text-[var(--color-sage)]">
            {count} {count === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
};

export default SearchCategory;
