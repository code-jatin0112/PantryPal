import React from 'react';

/**
 * Badge — compact status label
 *
 * Props:
 *  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 *  size:    'sm' | 'md'
 *  dot:     boolean — show colored dot prefix
 *  icon:    Lucide icon component
 */
const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
}) => {
  const variantClass = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    info:    'badge-info',
    neutral: 'badge-neutral',
  }[variant];

  const dotColor = {
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger:  'bg-[var(--color-danger)]',
    info:    'bg-[var(--color-info)]',
    neutral: 'bg-[var(--color-sage)]',
  }[variant];

  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : '';

  return (
    <span className={`badge ${variantClass} ${sizeClass} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
      )}
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

export default Badge;
