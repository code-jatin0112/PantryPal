import React, { useState } from 'react';
import { Package, Check } from 'lucide-react';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const IngredientList = ({ ingredients = [], servings = 2, baseServings = 2 }) => {
  const [checkedIds, setCheckedIds] = useState(new Set());

  const toggleCheck = (idx) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const scaleRatio = Number(servings) / (Number(baseServings) || 2);

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Package size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
              Ingredients
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">
              {ingredients.length} item{ingredients.length !== 1 ? 's' : ''} for {servings} serving{servings !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <p className="text-xs text-[var(--color-sage)] py-4 text-center">
          No ingredients listed for this recipe.
        </p>
      ) : (
        <ul className="space-y-2">
          {ingredients.map((ing, idx) => {
            const isChecked = checkedIds.has(idx);
            const originalQty = ing.quantity !== undefined ? ing.quantity : null;
            const scaledQty = originalQty !== null ? originalQty * scaleRatio : null;

            return (
              <li
                key={ing.id || idx}
                onClick={() => toggleCheck(idx)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                  isChecked
                    ? 'bg-[var(--color-parchment)] border-transparent opacity-60'
                    : 'bg-white border-[rgba(138,144,112,0.12)] hover:border-[var(--color-sage)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isChecked
                        ? 'bg-[var(--color-sage)] border-[var(--color-sage)] text-white'
                        : 'border-[rgba(138,144,112,0.30)] bg-white'
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>

                  <span
                    className={`text-sm font-semibold truncate ${
                      isChecked ? 'line-through text-[var(--color-sage)]' : 'text-[var(--color-dark)]'
                    }`}
                  >
                    {ing.name}
                  </span>
                </div>

                <span className="text-xs font-bold text-[var(--color-bark)] tabular-nums flex-shrink-0">
                  {formatIngredientQuantity(scaledQty, ing.unit)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default IngredientList;
