import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, ArrowRight, ShoppingCart } from 'lucide-react';
import SectionCard from './SectionCard';

const LowStockItems = ({ items = [] }) => {
  return (
    <SectionCard
      icon={TrendingDown}
      title="Low Stock"
      subtitle="Items running below safety threshold"
      action={
        <Link
          to="/shopping-list"
          className="text-xs font-semibold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors flex items-center gap-1"
        >
          <span>Restock</span>
          <ArrowRight size={13} />
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--color-sage)]">
          Pantry is well-stocked with no shortages!
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => {
            const percent = item.percent || 20;
            const isCritical = percent <= 15;

            return (
              <div key={item.id || item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-dark)] text-sm">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-[var(--color-sage)]">
                      ({item.currentQty} left of {item.minQty})
                    </span>
                  </div>
                  <span
                    className={`font-extrabold ${
                      isCritical ? 'text-[var(--color-danger)]' : 'text-amber-600'
                    }`}
                  >
                    {percent}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="h-2 w-full bg-[var(--color-parchment)] rounded-full overflow-hidden border border-[rgba(138,144,112,0.15)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical ? 'bg-[var(--color-danger)]' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

export default LowStockItems;
