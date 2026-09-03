import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Spinner — loading indicator
 *
 * Props:
 *  size:    'sm' | 'md' | 'lg' | 'xl'
 *  color:   string (Tailwind-compatible class or CSS color)
 *  label:   string (accessible aria-label)
 *  center:  boolean — wrap in centering container
 */
const Spinner = ({
  size = 'md',
  className = '',
  label = 'Loading...',
  center = false,
}) => {
  const sizeMap = {
    sm:  16,
    md:  24,
    lg:  36,
    xl:  48,
  };

  const spinner = (
    <Loader2
      size={sizeMap[size]}
      className={`animate-spin text-[var(--color-sage)] ${className}`}
      aria-label={label}
      role="status"
    />
  );

  if (!center) return spinner;

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
};

/**
 * FullPageSpinner — centered full-viewport loading state
 */
export const FullPageSpinner = ({ label = 'Loading...' }) => (
  <div
    className="fixed inset-0 bg-[var(--color-parchment)] flex flex-col items-center justify-center gap-4 z-50"
    role="status"
    aria-label={label}
  >
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center shadow-elevated animate-pulse-soft">
      <Loader2 size={28} className="text-white animate-spin" />
    </div>
    <p className="text-sm text-[var(--color-sage)] font-medium">{label}</p>
  </div>
);

export default Spinner;
