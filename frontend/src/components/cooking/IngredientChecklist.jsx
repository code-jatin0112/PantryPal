import React from 'react';
import { Package, Check, CheckCircle2 } from 'lucide-react';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const IngredientChecklist = ({
  ingredients = [],
  checkedIndices = new Set(),
  onToggleIngredient,
}) => {
  const checkedCount = checkedIndices.size;
  const totalCount = ingredients.length;
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Package size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Ingredients
            </h3>
            <span className="text-[11px] text-[var(--color-sage)] font-semibold">
              {checkedCount} of {totalCount} prepped ({pct}%)
            </span>
          </div>
        </div>

        {checkedCount === totalCount && totalCount > 0 && (
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            All Prepped
          </span>
        )}
      </div>

      {/* Mini Progress */}
      <div className="h-1.5 w-full bg-[var(--color-parchment)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-sage)] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
        {ingredients.map((ing, idx) => {
          const isChecked = checkedIndices.has(idx);
          const name = typeof ing === 'string' ? ing : ing.name;
          const qty = typeof ing === 'object' ? formatIngredientQuantity(ing.quantity, ing.unit) : '';

          return (
            <div
              key={idx}
              onClick={() => onToggleIngredient(idx)}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer select-none ${
                isChecked
                  ? 'bg-[var(--color-parchment)] border-transparent opacity-60'
                  : 'bg-white border-[rgba(138,144,112,0.12)] hover:border-[var(--color-sage)]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                    isChecked
                      ? 'bg-[var(--color-sage)] border-[var(--color-sage)] text-white'
                      : 'border-[rgba(138,144,112,0.35)] bg-white'
                  }`}
                >
                  {isChecked && <Check size={10} strokeWidth={3} />}
                </div>

                <span
                  className={`font-semibold truncate ${
                    isChecked ? 'line-through text-[var(--color-sage)]' : 'text-[var(--color-dark)]'
                  }`}
                >
                  {name}
                </span>
              </div>

              {qty && (
                <span className="font-extrabold text-[var(--color-bark)] tabular-nums flex-shrink-0">
                  {qty}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IngredientChecklist;
