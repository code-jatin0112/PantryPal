import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Edit2, Trash2, Tag, AlertCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const ShoppingCard = ({
  item,
  onTogglePurchased,
  onEdit,
  onDelete,
  index = 0,
}) => {
  const isChecked = Boolean(item.isPurchased);
  const priority = item.priority || 'MEDIUM';

  const priorityVariant =
    priority === 'HIGH' ? 'danger' : priority === 'LOW' ? 'neutral' : 'warning';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all flex flex-col justify-between group relative ${
        isChecked
          ? 'border-[rgba(138,144,112,0.12)] bg-[var(--color-parchment)] opacity-75'
          : 'border-[rgba(138,144,112,0.18)]'
      }`}
    >
      <div>
        {/* Top Header: Checkbox, Name, and Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onTogglePurchased(item)}
              aria-label={isChecked ? `Mark ${item.name} as pending` : `Mark ${item.name} as purchased`}
              className="mt-0.5 text-[var(--color-sage)] hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
            >
              {isChecked ? (
                <CheckCircle2 size={20} className="text-[var(--color-success)] fill-emerald-100" />
              ) : (
                <Circle size={20} className="hover:text-[var(--color-dark)]" />
              )}
            </button>

            <div className="min-w-0">
              <h3
                className={`font-bold text-base leading-snug truncate transition-all ${
                  isChecked
                    ? 'line-through text-[var(--color-sage)]'
                    : 'text-[var(--color-dark)]'
                }`}
              >
                {item.name}
              </h3>
              {item.category && (
                <span className="text-[11px] font-semibold text-[var(--color-sage)] block mt-0.5">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.name}`}
              className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-white transition-colors"
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

        {/* Quantity display */}
        <div className="my-3 flex items-center justify-between gap-2 bg-[var(--color-parchment)] p-2.5 rounded-xl">
          <span className="text-xs text-[var(--color-sage)] font-semibold">Quantity</span>
          <span className="text-base font-extrabold text-[var(--color-dark)] tabular-nums">
            {formatIngredientQuantity(item.quantity, item.unit)}
          </span>
        </div>
      </div>

      {/* Footer: Priority & Status Badges */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(138,144,112,0.10)] text-xs">
        <Badge variant={priorityVariant} size="sm">
          {priority}
        </Badge>

        <span className="text-[11px] font-medium text-[var(--color-sage)]">
          {isChecked ? 'Purchased' : 'Pending'}
        </span>
      </div>
    </motion.div>
  );
};

export default ShoppingCard;
