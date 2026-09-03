import React from 'react';
import { CardSkeleton, StatCardSkeleton } from '../ui/Skeleton';

const RecipeSkeleton = ({ view = 'grid', count = 8 }) => {
  if (view === 'details') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-[rgba(138,144,112,0.1)] rounded-xl animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border border-[rgba(138,144,112,0.15)] p-6 space-y-4 animate-pulse">
          <div className="h-8 w-3/4 bg-[rgba(138,144,112,0.1)] rounded-xl" />
          <div className="h-4 w-1/2 bg-[rgba(138,144,112,0.08)] rounded-lg" />
          <div className="h-20 bg-[rgba(138,144,112,0.05)] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-white rounded-2xl border border-[rgba(138,144,112,0.15)] p-4 animate-pulse" />
          <div className="h-48 bg-white rounded-2xl border border-[rgba(138,144,112,0.15)] p-4 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <StatCardSkeleton key={idx} />
        ))}
      </div>

      {/* Grid or Table Skeleton */}
      {view === 'table' ? (
        <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-4 space-y-3">
          <div className="h-10 bg-[rgba(138,144,112,0.08)] rounded-xl animate-pulse" />
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="h-14 bg-[rgba(138,144,112,0.05)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] overflow-hidden shadow-sm animate-pulse">
              <div className="h-36 bg-[rgba(138,144,112,0.08)]" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-[rgba(138,144,112,0.12)] rounded-lg w-3/4" />
                <div className="h-3 bg-[rgba(138,144,112,0.08)] rounded-md w-1/2" />
                <div className="h-10 bg-[rgba(138,144,112,0.05)] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeSkeleton;
