import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import SectionCard from './SectionCard';
import { updateShoppingListItem } from '../../services/dashboardService';

const ShoppingPreview = ({ initialItems = [] }) => {
  const [items, setItems] = useState(initialItems);

  const handleToggle = async (item) => {
    const nextState = !item.isPurchased;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isPurchased: nextState } : i))
    );

    try {
      if (item.id && !String(item.id).startsWith('mock')) {
        await updateShoppingListItem(item.id, { isPurchased: nextState });
      }
    } catch {
      // Revert if API error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isPurchased: !nextState } : i))
      );
    }
  };

  const pendingCount = items.filter((i) => !i.isPurchased).length;

  return (
    <SectionCard
      icon={ShoppingCart}
      title="Shopping List Preview"
      subtitle={`${pendingCount} item${pendingCount !== 1 ? 's' : ''} to buy`}
      action={
        <Link
          to="/shopping-list"
          className="text-xs font-semibold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--color-sage)]">
          Your shopping list is clear!
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const isChecked = Boolean(item.isPurchased);

            return (
              <button
                key={item.id || item.name}
                type="button"
                onClick={() => handleToggle(item)}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors ${
                  isChecked
                    ? 'bg-[var(--color-parchment)] opacity-60 hover:opacity-80'
                    : 'hover:bg-[var(--color-parchment)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isChecked ? (
                    <CheckCircle2
                      size={18}
                      className="text-[var(--color-success)] flex-shrink-0"
                    />
                  ) : (
                    <Circle
                      size={18}
                      className="text-[var(--color-sage)] flex-shrink-0"
                    />
                  )}
                  <span
                    className={`text-sm font-semibold truncate ${
                      isChecked
                        ? 'line-through text-[var(--color-sage)]'
                        : 'text-[var(--color-dark)]'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {item.quantity && (
                  <span className="text-xs text-[var(--color-sage)] font-medium flex-shrink-0">
                    {item.quantity} {item.unit || ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

export default ShoppingPreview;
