import React from 'react';
import Skeleton from '../ui/Skeleton';

const NotificationSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[rgba(138,144,112,0.15)] flex items-start gap-3.5 shadow-xs"
        >
          <Skeleton width="40px" height="40px" rounded="lg" />
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <Skeleton width="35%" height="16px" rounded="md" />
              <Skeleton width="60px" height="12px" rounded="md" />
            </div>
            <Skeleton width="80%" height="14px" rounded="md" />
            <Skeleton width="110px" height="28px" rounded="md" className="mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSkeleton;
