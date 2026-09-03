import React from 'react';
import { Edit2, Trash2, Plus, Minus } from 'lucide-react';
import ExpiryBadge from './ExpiryBadge';
import StockBadge from './StockBadge';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const PantryTable = ({ items = [], onEdit, onDelete, onAdjustStock }) => {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.15)] text-[11px] font-bold text-[var(--color-sage)] uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-5">Item Name</th>
              <th scope="col" className="py-3.5 px-4">Category</th>
              <th scope="col" className="py-3.5 px-4">Quantity</th>
              <th scope="col" className="py-3.5 px-4">Expiry Date</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(138,144,112,0.10)] text-sm">
            {items.map((item) => {
              const expiryDate = item.expiryDate || item.expirationDate;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[var(--color-parchment)] transition-colors group"
                >
                  {/* Name */}
                  <td className="py-3.5 px-5 font-bold text-[var(--color-dark)]">
                    {item.name}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-sage)]">
                    {item.category || 'General'}
                  </td>

                  {/* Quantity & Quick stepper */}
                  <td className="py-3.5 px-4 font-bold text-[var(--color-dark)] tabular-nums">
                    <div className="flex items-center gap-2">
                      <span>{formatIngredientQuantity(item.quantity, item.unit)}</span>
                      {onAdjustStock && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => onAdjustStock(item, -1)}
                            disabled={item.quantity <= 0}
                            aria-label={`Decrease ${item.name}`}
                            className="w-5 h-5 rounded bg-white border border-[rgba(138,144,112,0.2)] flex items-center justify-center hover:bg-[var(--color-sage)] hover:text-white transition-colors disabled:opacity-30"
                          >
                            <Minus size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(item, 1)}
                            aria-label={`Increase ${item.name}`}
                            className="w-5 h-5 rounded bg-white border border-[rgba(138,144,112,0.2)] flex items-center justify-center hover:bg-[var(--color-sage)] hover:text-white transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Expiry Date */}
                  <td className="py-3.5 px-4 text-xs text-[var(--color-sage)]">
                    {expiryDate ? (
                      new Date(expiryDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    ) : (
                      <span className="opacity-60">—</span>
                    )}
                  </td>

                  {/* Status Badges */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ExpiryBadge expiryDate={expiryDate} size="sm" />
                      <StockBadge quantity={item.quantity} minStock={item.minimumQuantity || 1} size="sm" />
                    </div>
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

export default PantryTable;
