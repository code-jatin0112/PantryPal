import React from 'react';

/**
 * Skeleton — shimmer loading placeholder
 *
 * Props:
 *  width:  string (CSS width, e.g. '100%', '120px')
 *  height: string (CSS height, e.g. '16px', '2rem')
 *  rounded: 'sm' | 'md' | 'lg' | 'full'
 *  className: string
 *  count:  number — render multiple skeletons stacked
 *  gap:    string — gap when count > 1
 */
const Skeleton = ({
  width = '100%',
  height = '16px',
  rounded = 'md',
  className = '',
  count = 1,
  gap = '8px',
}) => {
  const radiusMap = {
    sm:   'var(--radius-sm)',
    md:   'var(--radius-md)',
    lg:   'var(--radius-lg)',
    full: 'var(--radius-full)',
  };

  const item = (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: radiusMap[rounded],
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );

  if (count === 1) return item;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={{ width, height, borderRadius: radiusMap[rounded] }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * CardSkeleton — full card-shaped skeleton for grid loading states
 */
export const CardSkeleton = ({ className = '' }) => (
  <div className={`card p-5 space-y-3 ${className}`} aria-hidden="true">
    <Skeleton height="12px" width="60%" />
    <Skeleton height="20px" width="80%" />
    <Skeleton height="12px" width="45%" />
    <div className="flex gap-2 pt-1">
      <Skeleton height="22px" width="64px" rounded="full" />
      <Skeleton height="22px" width="64px" rounded="full" />
    </div>
  </div>
);

/**
 * StatCardSkeleton — skeleton for stat/metric cards
 */
export const StatCardSkeleton = () => (
  <div className="stat-card flex items-center gap-4" aria-hidden="true">
    <Skeleton width="48px" height="48px" rounded="lg" />
    <div className="flex-1 space-y-2">
      <Skeleton height="24px" width="60px" />
      <Skeleton height="12px" width="80px" />
    </div>
  </div>
);

export default Skeleton;
