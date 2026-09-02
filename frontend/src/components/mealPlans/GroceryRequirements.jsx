import React, { useState } from 'react';
import { ShoppingCart, Check, Plus, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { createShoppingListItem } from '../../services/shoppingListService';
import { useToast } from '../../context/ToastContext';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const GroceryRequirements = ({ requirements = [], mealPlanName = 'this meal plan' }) => {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  const items = Array.isArray(requirements)
    ? requirements
    : requirements?.missingItems || requirements?.items || [];

  const handleAddAllToShoppingList = async () => {
    if (items.length === 0) return;
    setAdding(true);
    try {
      await Promise.allSettled(
        items.map((item) =>
          createShoppingListItem({
            name: item.name || item.ingredientName,
            quantity: item.missingQuantity || item.quantity || 1,
            unit: item.unit || 'pcs',
          })
        )
      );

      setAddedIds(new Set(items.map((_, idx) => idx)));
      toast(`Added ${items.length} items to your shopping list! 🛒`, 'success');
    } catch {
      toast('Failed to add some items to shopping list.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleAddSingleItem = async (item, idx) => {
    try {
      await createShoppingListItem({
        name: item.name || item.ingredientName,
        quantity: item.missingQuantity || item.quantity || 1,
        unit: item.unit || 'pcs',
      });
      setAddedIds((prev) => new Set([...prev, idx]));
      toast(`Added "${item.name || item.ingredientName}" to shopping list!`, 'success');
    } catch {
      toast('Failed to add item.', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
              Grocery Requirements
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">
              Missing ingredients needed for {mealPlanName}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            icon={ShoppingCart}
            loading={adding}
            onClick={handleAddAllToShoppingList}
          >
            Add All to Shopping List
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-[var(--color-sage)] font-semibold">
            🎉 Great news! All required ingredients are already available in your pantry.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[rgba(138,144,112,0.10)]">
          {items.map((item, idx) => {
            const isAdded = addedIds.has(idx);
            const name = item.name || item.ingredientName || 'Ingredient';
            const qty = item.missingQuantity || item.quantity || 1;
            const unit = item.unit || 'pcs';
            const sourceDish = item.recipeTitle || item.sourceRecipe || item.mealType;

            return (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-3 text-sm transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-dark)] truncate">{name}</span>
                    {sourceDish && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-parchment)] text-[var(--color-sage)] font-semibold truncate hidden sm:inline-block">
                        {sourceDish}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-sage)] font-semibold block mt-0.5">
                    Need {formatIngredientQuantity(qty, unit)}
                  </span>
                </div>

                <Button
                  variant={isAdded ? 'secondary' : 'primary'}
                  size="sm"
                  icon={isAdded ? Check : Plus}
                  disabled={isAdded}
                  onClick={() => handleAddSingleItem(item, idx)}
                  className="flex-shrink-0"
                >
                  {isAdded ? 'Added' : 'Add to List'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroceryRequirements;
