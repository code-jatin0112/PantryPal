import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Plus, Minus, Calendar, ShoppingBag } from 'lucide-react';
import ExpiryBadge from './ExpiryBadge';
import StockBadge from './StockBadge';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const PantryCard = ({
  item,
  onEdit,
  onDelete,
  onAdjustStock,
  index = 0,
}) => {
  const expiryDate = item.expiryDate || item.expirationDate;
  const purchaseDate = item.createdAt || item.purchaseDate;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all flex flex-col justify-between group relative"
    >
      {/* Top Bar: Name & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[var(--color-dark)] text-base truncate leading-snug">
              {item.name}
            </h3>
            {item.category && (
              <span className="text-[11px] font-semibold text-[var(--color-sage)] mt-0.5 inline-block">
                {item.category}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.name}`}
              className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.name}`}
              className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Quantity & Quick Stepper */}
        <div className="my-3 flex items-center justify-between gap-2 bg-[var(--color-parchment)] p-2.5 rounded-xl">
          <div>
            <p className="text-xl font-extrabold text-[var(--color-dark)] tabular-nums leading-none">
              {formatIngredientQuantity(item.quantity, item.unit)}
            </p>
          </div>

          {onAdjustStock && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onAdjustStock(item, -1)}
                disabled={item.quantity <= 0}
                aria-label={`Decrease quantity of ${item.name}`}
                className="w-7 h-7 rounded-lg bg-white border border-[rgba(138,144,112,0.20)] text-[var(--color-dark)] flex items-center justify-center hover:bg-[var(--color-sage)] hover:text-white transition-colors disabled:opacity-40"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() => onAdjustStock(item, 1)}
                aria-label={`Increase quantity of ${item.name}`}
                className="w-7 h-7 rounded-lg bg-white border border-[rgba(138,144,112,0.20)] text-[var(--color-dark)] flex items-center justify-center hover:bg-[var(--color-sage)] hover:text-white transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info: Badges & Dates */}
      <div className="space-y-2 pt-2 border-t border-[rgba(138,144,112,0.10)] mt-2 text-xs text-[var(--color-sage)]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <ExpiryBadge expiryDate={expiryDate} size="sm" />
          <StockBadge quantity={item.quantity} minStock={item.minimumQuantity || 1} size="sm" />
        </div>

        {purchaseDate && (
          <div className="flex items-center gap-1.5 text-[11px] opacity-80 pt-0.5">
            <ShoppingBag size={11} />
            <span>
              Added {new Date(purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PantryCard;
