import React from 'react';
import { CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const ShoppingTable = ({
  items = [],
  onTogglePurchased,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.15)] text-[11px] font-bold text-[var(--color-sage)] uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 w-12 text-center">Status</th>
              <th scope="col" className="py-3.5 px-4">Item Name</th>
              <th scope="col" className="py-3.5 px-4">Category</th>
              <th scope="col" className="py-3.5 px-4">Quantity</th>
              <th scope="col" className="py-3.5 px-4">Priority</th>
              <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(138,144,112,0.10)] text-sm">
            {items.map((item) => {
              const isChecked = Boolean(item.isPurchased);
              const priority = item.priority || 'MEDIUM';

              const priorityVariant =
                priority === 'HIGH' ? 'danger' : priority === 'LOW' ? 'neutral' : 'warning';

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-[var(--color-parchment)] transition-colors group ${
                    isChecked ? 'opacity-70 bg-[var(--color-parchment)]/50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onTogglePurchased(item)}
                      aria-label={isChecked ? `Mark ${item.name} as pending` : `Mark ${item.name} as purchased`}
                      className="text-[var(--color-sage)] hover:scale-110 active:scale-95 transition-transform inline-flex items-center justify-center"
                    >
                      {isChecked ? (
                        <CheckCircle2 size={18} className="text-[var(--color-success)] fill-emerald-100" />
                      ) : (
                        <Circle size={18} className="hover:text-[var(--color-dark)]" />
                      )}
                    </button>
                  </td>

                  {/* Name */}
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={`truncate block ${
                        isChecked
                          ? 'line-through text-[var(--color-sage)]'
                          : 'text-[var(--color-dark)]'
                      }`}
                    >
                      {item.name}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-sage)]">
                    {item.category || 'General'}
                  </td>

                  {/* Quantity */}
                  <td className="py-3.5 px-4 font-bold text-[var(--color-dark)] tabular-nums">
                    {formatIngredientQuantity(item.quantity, item.unit)}
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <Badge variant={priorityVariant} size="sm">
                      {priority}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShoppingTable;
