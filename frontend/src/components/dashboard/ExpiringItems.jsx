import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import SectionCard from './SectionCard';
import Badge from '../ui/Badge';

const ExpiringItems = ({ items = [] }) => {
  return (
    <SectionCard
      icon={AlertTriangle}
      title="Expiring Soon"
      subtitle="Consume these items to prevent food waste"
      action={
        <Link
          to="/pantry"
          className="text-xs font-semibold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors flex items-center gap-1"
        >
          <span>Pantry</span>
          <ArrowRight size={13} />
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--color-sage)]">
          All your ingredients are fresh and safe!
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id || item.name}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                item.variant === 'danger'
                  ? 'bg-[var(--color-danger-bg)] border-[rgba(217,92,92,0.25)]'
                  : 'bg-[var(--color-warning-bg)] border-[rgba(217,164,65,0.25)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.variant === 'danger'
                      ? 'bg-[rgba(217,92,92,0.15)] text-[var(--color-danger)]'
                      : 'bg-[rgba(217,164,65,0.15)] text-[var(--color-warning)]'
                  }`}
                >
                  <Calendar size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-dark)] truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-bark)] opacity-75">
                    Needs immediate use
                  </p>
                </div>
              </div>

              <Badge
                variant={item.variant === 'danger' ? 'danger' : 'warning'}
                size="sm"
                dot
              >
                {item.label || `${item.daysLeft} days`}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default ExpiringItems;
