import React from 'react';
import { TrendingDown } from 'lucide-react';
import Badge from '../ui/Badge';

const StockBadge = ({ quantity, minStock = 1, size = 'md', className = '' }) => {
  const isLowStock = quantity !== undefined && quantity !== null && Number(quantity) <= Number(minStock);

  if (!isLowStock) return null;

  return (
    <Badge
      variant="warning"
      size={size}
      icon={TrendingDown}
      className={`font-semibold ${className}`}
    >
      Low Stock
    </Badge>
  );
};

export default StockBadge;
