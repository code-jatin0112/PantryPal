import React, { useState } from 'react';
import { ShoppingCart, Check, Plus, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { createShoppingListItem } from '../../services/shoppingListService';
import { useToast } from '../../context/ToastContext';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const GroceryRequirements = ({ requirements = [], mealPlanName = 'this meal plan' }) => {
  const rawToast = useToast();
  const toast = (msg, type) => {
    if (typeof rawToast === 'function') {
      rawToast(msg, type);
    }
  };
  const [adding, setAdding] = useState(false);
  const [addedKeys, setAddedKeys] = useState(new Set());

  const items = Array.isArray(requirements)
    ? requirements
    : requirements?.missingItems || requirements?.items || [];

  const getItemKey = (item) => {
    if (!item) return '';
    if (item.id) return String(item.id);
    if (item.ingredientId) return String(item.ingredientId);
    const name = (item.name || item.ingredientName || '').trim().toLowerCase();
    const unit = (item.unit || '').trim().toLowerCase();
    return `${name}::${unit}`;
  };

  const pendingItems = items.filter((item) => !addedKeys.has(getItemKey(item)));
  const allAdded = items.length > 0 && pendingItems.length === 0;

  const handleAddAllToShoppingList = async () => {
    if (pendingItems.length === 0) return;
    setAdding(true);
    try {
      const results = await Promise.allSettled(
        pendingItems.map((item) =>
          createShoppingListItem({
            name: item.name || item.ingredientName,
            quantity: item.missingQuantity || item.quantity || 1,
            unit: item.unit || 'pcs',
          })
        )
      );

      const newlyAddedKeys = [];
      let failureCount = 0;
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          newlyAddedKeys.push(getItemKey(pendingItems[i]));
        } else {
          failureCount += 1;
        }
      });

      if (newlyAddedKeys.length > 0) {
        setAddedKeys((prev) => new Set([...prev, ...newlyAddedKeys]));
      }

      if (failureCount === 0) {
        toast(`Added ${newlyAddedKeys.length} items to your shopping list! 🛒`, 'success');
      } else if (newlyAddedKeys.length > 0) {
        toast(`Added ${newlyAddedKeys.length} items, but ${failureCount} failed to save.`, 'warning');
      } else {
        toast('Failed to add items to shopping list.', 'error');
      }
    } catch {
      toast('Failed to add items to shopping list.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleAddSingleItem = async (item) => {
    const key = getItemKey(item);
    try {
      await createShoppingListItem({
        name: item.name || item.ingredientName,
        quantity: item.missingQuantity || item.quantity || 1,
        unit: item.unit || 'pcs',
      });
      setAddedKeys((prev) => new Set([...prev, key]));
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
            variant={allAdded ? 'secondary' : 'primary'}
            size="sm"
            icon={allAdded ? Check : ShoppingCart}
            loading={adding}
            disabled={allAdded || adding}
            onClick={handleAddAllToShoppingList}
          >
            {allAdded
              ? 'All Items Added'
              : pendingItems.length < items.length
              ? `Add Remaining (${pendingItems.length})`
              : 'Add All to Shopping List'}
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
            const isAdded = addedKeys.has(getItemKey(item));
            const name = item.name || item.ingredientName || 'Ingredient';
            const qty = item.missingQuantity || item.quantity || 1;
            const unit = item.unit || 'pcs';
            const sourceDish = item.recipeTitle || item.sourceRecipe || item.mealType;

            return (
              <div
                key={getItemKey(item) || idx}
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
                  onClick={() => handleAddSingleItem(item)}
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
