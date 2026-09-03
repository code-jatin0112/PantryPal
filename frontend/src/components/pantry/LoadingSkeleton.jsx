import React from 'react';
import { CardSkeleton, StatCardSkeleton } from '../ui/Skeleton';

const LoadingSkeleton = ({ viewMode = 'grid', count = 6 }) => {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <StatCardSkeleton key={idx} />
        ))}
      </div>

      {/* View Mode Skeleton */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-4 space-y-3">
          <div className="h-10 bg-[rgba(138,144,112,0.08)] rounded-xl animate-pulse" />
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="h-14 bg-[rgba(138,144,112,0.05)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LoadingSkeleton;
