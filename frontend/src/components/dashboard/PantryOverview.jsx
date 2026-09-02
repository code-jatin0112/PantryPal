import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SectionCard from './SectionCard';
import Badge from '../ui/Badge';

const PantryOverview = ({ items = [] }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'FRESH':
        return (
          <Badge variant="success" dot size="sm">
            Fresh
          </Badge>
        );
      case 'LOW_STOCK':
        return (
          <Badge variant="warning" dot size="sm">
            Low Stock
          </Badge>
        );
      case 'EXPIRING_SOON':
        return (
          <Badge variant="danger" dot size="sm">
            Expiring Soon
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            In Stock
          </Badge>
        );
    }
  };

  return (
    <SectionCard
      icon={Package}
      title="Pantry Overview"
      subtitle="Recent inventory movements and status"
      action={
        <Link
          to="/pantry"
          className="text-xs font-semibold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--color-sage)]">
          No recent pantry items found.
        </div>
      ) : (
        <div className="divide-y divide-[rgba(138,144,112,0.10)] -my-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-[var(--color-parchment)] px-2 -mx-2 rounded-xl transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-dark)] truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-sage)]">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">{getStatusBadge(item.status)}</div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default PantryOverview;
