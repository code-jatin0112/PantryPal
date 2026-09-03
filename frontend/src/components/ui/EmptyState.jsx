import React from 'react';
import { PackageOpen, SearchX, WifiOff, ShieldAlert, ServerCrash } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState — zero-data placeholder component
 *
 * Props:
 *  icon:         Lucide icon component (default: PackageOpen)
 *  title:        string
 *  description:  string
 *  action:       { label: string, onClick: fn, icon?: LucideIcon }
 *  className:    string
 */
export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-[rgba(138,144,112,0.10)] flex items-center justify-center mb-5">
      <Icon size={30} className="text-[var(--color-sage)]" />
    </div>
    <h3 className="text-lg font-bold text-[var(--color-dark)] mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-[var(--color-sage)] max-w-xs leading-relaxed mb-6">
        {description}
      </p>
    )}
    {action && (
      <Button
        variant="primary"
        icon={action.icon}
        onClick={action.onClick}
        size="md"
      >
        {action.label}
      </Button>
    )}
  </div>
);

/**
 * ErrorState — API/fetch error display
 *
 * Props:
 *  message:  string
 *  onRetry:  () => void
 *  type:     'generic' | 'network' | 'auth' | 'server'
 */
export const ErrorState = ({
  message = 'Something went wrong.',
  onRetry,
  type = 'generic',
  className = '',
}) => {
  const config = {
    network: { icon: WifiOff,      color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-bg)]' },
    auth:    { icon: ShieldAlert,  color: 'text-[var(--color-danger)]',  bg: 'bg-[var(--color-danger-bg)]' },
    server:  { icon: ServerCrash,  color: 'text-[var(--color-danger)]',  bg: 'bg-[var(--color-danger-bg)]' },
    generic: { icon: SearchX,      color: 'text-[var(--color-sage)]',    bg: 'bg-[rgba(138,144,112,0.10)]' },
  }[type] || { icon: SearchX, color: 'text-[var(--color-sage)]', bg: 'bg-[rgba(138,144,112,0.10)]' };

  const { icon: Icon, color, bg } = config;

  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
      <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mb-4`}>
        <Icon size={26} className={color} />
      </div>
      <h3 className="text-base font-bold text-[var(--color-dark)] mb-1.5">
        {type === 'network' ? 'Connection Error' : 'Something Went Wrong'}
      </h3>
      <p className="text-sm text-[var(--color-sage)] max-w-xs mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
