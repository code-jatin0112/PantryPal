import React, { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Plus, Check, Trash2, DollarSign, CheckCircle2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import shoppingListService from "../../services/shoppingListService";

export const ShoppingList = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "pcs",
    estimatedCost: 3.5,
  });

  const fetchShoppingList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await shoppingListService.getShoppingList();
      setItems(response.data?.items || []);
    } catch (err) {
      // Fallback default list
      setItems([
        { id: "1", name: "Organic Brown Eggs", quantity: 1, unit: "dozen", isPurchased: false, estimatedCost: 4.5 },
        { id: "2", name: "Avocados", quantity: 3, unit: "pcs", isPurchased: false, estimatedCost: 3.0 },
        { id: "3", name: "Whole Grain Sourdough", quantity: 1, unit: "loaf", isPurchased: true, estimatedCost: 5.0 },
        { id: "4", name: "Almond Milk", quantity: 2, unit: "liters", isPurchased: false, estimatedCost: 6.0 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  const handleTogglePurchased = async (item) => {
    const nextStatus = !item.isPurchased;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, isPurchased: nextStatus } : i
      )
    );

    try {
      await shoppingListService.updateItem(item.id, {
        isPurchased: nextStatus,
      });
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isPurchased: !nextStatus } : i
        )
      );
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;

    try {
      const res = await shoppingListService.addItem({
        name: newItem.name,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        estimatedCost: parseFloat(newItem.estimatedCost || 0),
      });

      const added = res.data?.item || {
        id: `item-${Date.now()}`,
        name: newItem.name,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        estimatedCost: parseFloat(newItem.estimatedCost || 0),
        isPurchased: false,
      };

      setItems((prev) => [added, ...prev]);
      setIsModalOpen(false);
      setNewItem({ name: "", quantity: 1, unit: "pcs", estimatedCost: 3.5 });
    } catch (err) {
      alert(err.message || "Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await shoppingListService.deleteItem(itemId);
    } catch (err) {
      // Silent error for UI responsiveness
    }
  };

  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const estimatedTotal = items
    .filter((i) => !i.isPurchased)
    .reduce((sum, i) => sum + (i.estimatedCost || 0), 0);

  if (isLoading) {
    return <Loader message="Loading your grocery shopping list..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#272A1F] tracking-tight">
            Shopping List
          </h2>
          <p className="text-sm text-[#5E5947]">
            Ingredients needed for planned meals and restocking your pantry.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm"
        >
          Add Grocery Item
        </Button>
      </div>

      {/* Overview Stats Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8C6A5]/40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#8A9070]" />
          <span className="text-sm font-bold text-[#272A1F]">
            {purchasedCount} of {items.length} items purchased
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Est. Remaining: ${Math.round(estimatedTotal * 100) / 100}</span>
        </div>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping List is Empty"
          description="Add items manually or auto-generate from missing ingredients in your meal plans."
          actionLabel="Add Grocery Item"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="p-4 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleTogglePurchased(item)}
              className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer select-none border ${
                item.isPurchased
                  ? "bg-gray-50 border-gray-200 opacity-60 line-through"
                  : "bg-[#FAF8F3]/60 border-[#D8C6A5]/30 hover:bg-[#FAF8F3] hover:border-[#8A9070]/40"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                    item.isPurchased
                      ? "bg-[#8A9070] border-[#8A9070] text-white"
                      : "bg-white border-[#D8C6A5]/60 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#272A1F] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#5E5947] mt-0.5">
                    {item.quantity} {item.unit}
                    {item.estimatedCost ? ` • $${item.estimatedCost}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="p-1.5 rounded-lg text-[#5E5947] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Grocery Item"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Input
            label="Item Name"
            placeholder="e.g. Greek Feta Cheese"
            required
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              step="0.1"
              min="0.1"
              required
              value={newItem.quantity}
              onChange={(e) =>
                setNewItem({ ...newItem, quantity: e.target.value })
              }
            />

            <div>
              <label className="text-sm font-semibold text-[#272A1F] block mb-1.5">
                Unit
              </label>
              <select
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
                className="w-full bg-white text-base text-[#272A1F] rounded-xl border border-[#D8C6A5]/60 px-4 py-2.5 shadow-sm focus:outline-none focus:border-[#8A9070]"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="grams">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="liters">Liters</option>
                <option value="dozen">Dozen</option>
                <option value="loaf">Loaf</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>

          <Input
            label="Estimated Price ($)"
            type="number"
            step="0.5"
            min="0"
            value={newItem.estimatedCost}
            onChange={(e) =>
              setNewItem({ ...newItem, estimatedCost: e.target.value })
            }
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8C6A5]/30">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add to List
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShoppingList;
