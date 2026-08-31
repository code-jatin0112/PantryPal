import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Package, Filter, AlertTriangle, Search, RefreshCw, Trash2, Edit2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import IngredientCard from "../../components/ui/IngredientCard";
import SearchBar from "../../components/ui/SearchBar";
import FilterPanel from "../../components/ui/FilterPanel";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { useDebounce } from "../../hooks/useDebounce";
import pantryService from "../../services/pantryService";

const CATEGORIES = [
  "produce",
  "dairy",
  "meat",
  "pantry",
  "spices",
  "bakery",
  "frozen",
  "beverages",
  "other",
];

export const Pantry = () => {
  const [pantries, setPantries] = useState([]);
  const [selectedPantryId, setSelectedPantryId] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    unit: "pcs",
    category: "pantry",
    expiryDate: "",
    lowStockThreshold: 1,
  });

  const fetchPantryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await pantryService.getPantries();
      const userPantries = response.data?.pantries || [];
      setPantries(userPantries);

      if (userPantries.length > 0) {
        const activeId = selectedPantryId || userPantries[0].id;
        setSelectedPantryId(activeId);
        const itemsRes = await pantryService.getPantryItems(activeId);
        setItems(itemsRes.data?.items || []);
      } else {
        // Create initial default pantry if none exist
        const newPantry = await pantryService.createPantry({
          name: "Main Kitchen",
          location: "Kitchen",
        });
        const created = newPantry.data?.pantry;
        if (created) {
          setPantries([created]);
          setSelectedPantryId(created.id);
          setItems([]);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load pantry inventory");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPantryId]);

  useEffect(() => {
    fetchPantryData();
  }, [fetchPantryData]);

  // Client-side filtering & searching
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesCategory = selectedCategory
        ? item.category?.toLowerCase() === selectedCategory.toLowerCase()
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [items, debouncedSearch, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      quantity: 1,
      unit: "pcs",
      category: "pantry",
      expiryDate: "",
      lowStockThreshold: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category || "pantry",
      expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
      lowStockThreshold: item.lowStockThreshold || 1,
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!selectedPantryId || !formData.name) return;

    try {
      if (editingItem) {
        await pantryService.updateItem(selectedPantryId, editingItem.id, {
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          category: formData.category,
          expiryDate: formData.expiryDate || null,
          lowStockThreshold: parseFloat(formData.lowStockThreshold),
        });
      } else {
        await pantryService.addItem(selectedPantryId, {
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          category: formData.category,
          expiryDate: formData.expiryDate || null,
          lowStockThreshold: parseFloat(formData.lowStockThreshold),
        });
      }

      setIsModalOpen(false);
      // Refresh items list
      const itemsRes = await pantryService.getPantryItems(selectedPantryId);
      setItems(itemsRes.data?.items || []);
    } catch (err) {
      alert(err.message || "Failed to save ingredient");
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.name} from pantry?`)) return;
    try {
      await pantryService.deleteItem(selectedPantryId, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      alert(err.message || "Failed to delete item");
    }
  };

  if (isLoading) {
    return <Loader message="Loading your pantry ingredients..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPantryData} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#272A1F] tracking-tight">
            Pantry Inventory
          </h2>
          <p className="text-sm text-[#5E5947]">
            Track ingredients, monitor expiration dates, and keep your kitchen stocked.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenAddModal}
          className="shadow-sm"
        >
          Add Ingredient
        </Button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search ingredients in your pantry..."
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white text-sm text-[#272A1F] rounded-xl border border-[#D8C6A5]/60 px-4 py-2.5 shadow-sm focus:outline-none focus:border-[#8A9070] cursor-pointer"
          >
            <option value="">All Categories ({items.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ingredients Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title={searchQuery ? "No matching ingredients" : "Your pantry is empty"}
          description={
            searchQuery
              ? `No ingredients matched "${searchQuery}".`
              : "Start adding ingredients to unlock AI recipe recommendations."
          }
          actionLabel={searchQuery ? "Clear Search" : "Add First Ingredient"}
          onAction={searchQuery ? () => setSearchQuery("") : handleOpenAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <IngredientCard
              key={item.id}
              item={item}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Ingredient" : "Add New Ingredient"}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <Input
            label="Ingredient Name"
            placeholder="e.g. Extra Virgin Olive Oil"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              step="0.1"
              min="0.1"
              required
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
            />

            <div>
              <label className="text-sm font-semibold text-[#272A1F] block mb-1.5">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full bg-white text-base text-[#272A1F] rounded-xl border border-[#D8C6A5]/60 px-4 py-2.5 shadow-sm focus:outline-none focus:border-[#8A9070]"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="grams">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="liter">Liters (L)</option>
                <option value="tbsp">Tablespoon (tbsp)</option>
                <option value="tsp">Teaspoon (tsp)</option>
                <option value="cups">Cups</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-[#272A1F] block mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full bg-white text-base text-[#272A1F] rounded-xl border border-[#D8C6A5]/60 px-4 py-2.5 shadow-sm focus:outline-none focus:border-[#8A9070] capitalize"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8C6A5]/30">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? "Update Item" : "Save Ingredient"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pantry;
