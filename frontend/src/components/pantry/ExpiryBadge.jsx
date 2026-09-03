import React from 'react';
import Badge from '../ui/Badge';

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'NONE', label: 'No expiry date', variant: 'neutral', daysLeft: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiryDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: 'EXPIRED', label: 'Expired', variant: 'danger', daysLeft };
  }
  if (daysLeft === 0) {
    return { status: 'EXPIRING_SOON', label: 'Expires today', variant: 'danger', daysLeft };
  }
  if (daysLeft === 1) {
    return { status: 'EXPIRING_SOON', label: '1 day left', variant: 'warning', daysLeft };
  }
  if (daysLeft <= 7) {
    return { status: 'EXPIRING_SOON', label: `${daysLeft} days left`, variant: 'warning', daysLeft };
  }

  return {
    status: 'FRESH',
    label: target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    variant: 'success',
    daysLeft,
  };
};

const ExpiryBadge = ({ expiryDate, size = 'md', className = '' }) => {
  const { label, variant } = getExpiryStatus(expiryDate);

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
};

export default ExpiryBadge;
