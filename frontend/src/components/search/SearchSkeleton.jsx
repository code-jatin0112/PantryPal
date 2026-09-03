import React from 'react';
import Skeleton from '../ui/Skeleton';

const SearchSkeleton = () => {
  return (
    <div className="space-y-3 pt-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[rgba(138,144,112,0.15)] flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3.5 flex-1">
            <Skeleton width="40px" height="40px" rounded="md" />
            <div className="space-y-1.5 flex-1">
              <Skeleton width="40%" height="16px" rounded="md" />
              <Skeleton width="65%" height="12px" rounded="md" />
            </div>
          </div>
          <Skeleton width="32px" height="32px" rounded="md" />
        </div>
      ))}
    </div>
  );
};

export default SearchSkeleton;
