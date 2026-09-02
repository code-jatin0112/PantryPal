import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, ShoppingBag } from 'lucide-react';

import ShoppingStats from '../../components/shopping/ShoppingStats';
import ShoppingSummary from '../../components/shopping/ShoppingSummary';
import ShoppingSearch from '../../components/shopping/ShoppingSearch';
import ShoppingFilters from '../../components/shopping/ShoppingFilters';
import ShoppingCard from '../../components/shopping/ShoppingCard';
import ShoppingTable from '../../components/shopping/ShoppingTable';
import ShoppingItemForm from '../../components/shopping/ShoppingItemForm';
import DeleteItemDialog from '../../components/shopping/DeleteItemDialog';
import EmptyShoppingList from '../../components/shopping/EmptyShoppingList';
import ShoppingSkeleton from '../../components/shopping/ShoppingSkeleton';
import Button from '../../components/ui/Button';

import {
  getShoppingList,
  createShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
} from '../../services/shoppingListService';
import { useToast } from '../../context/ToastContext';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { getErrorMessage } from '../../utils/errorHandler';

const ShoppingList = () => {
  const toast = useToast();

  // Data state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & search state
  const [search, debouncedSearch, setSearch] = useDebouncedSearch('');
  const [status, setStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'PURCHASED'
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal & Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [clearing, setClearing] = useState(false);

  // Load shopping list data
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShoppingList();
      const list = res.data.data?.items || res.data.data || [];
      setItems(list);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to load shopping list.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = items.length;
    const purchased = items.filter((i) => i.isPurchased).length;
    const remaining = total - purchased;
    const highPriority = items.filter((i) => !i.isPurchased && i.priority === 'HIGH').length;
    return { total, purchased, remaining, highPriority };
  }, [items]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search filter
        const q = debouncedSearch.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesSearch = !q || matchesName;

        // Status filter
        const matchesStatus =
          status === 'ALL'
            ? true
            : status === 'PURCHASED'
            ? Boolean(item.isPurchased)
            : !item.isPurchased;

        // Category filter
        const matchesCategory = category === 'All' || item.category === category;

        // Priority filter
        const matchesPriority =
          priority === 'ALL' || (item.priority || 'MEDIUM') === priority;

        return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
      })
      .sort((a, b) => {
        // Pending first if not explicitly viewing purchased
        if (status === 'ALL') {
          if (a.isPurchased !== b.isPurchased) {
            return a.isPurchased ? 1 : -1;
          }
        }

        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name_desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        if (sortBy === 'priority_desc') {
          const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (rank[b.priority || 'MEDIUM'] || 0) - (rank[a.priority || 'MEDIUM'] || 0);
        }
        if (sortBy === 'quantity_desc') {
          return (b.quantity || 0) - (a.quantity || 0);
        }
        return 0;
      });
  }, [items, debouncedSearch, status, category, priority, sortBy]);

  // Toggle purchased state
  const handleTogglePurchased = async (item) => {
    const nextState = !item.isPurchased;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isPurchased: nextState } : i))
    );

    try {
      await updateShoppingListItem(item.id, { isPurchased: nextState });
      toast(
        nextState
          ? `Marked "${item.name}" as purchased! ✅`
          : `Marked "${item.name}" as pending`,
        'success'
      );
    } catch (err) {
      // Revert optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isPurchased: !nextState } : i))
      );
      toast(getErrorMessage(err) || 'Failed to update item.', 'error');
    }
  };

  // Add / Edit submission
  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingItem) {
        await updateShoppingListItem(editingItem.id, {
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
        });
        toast(`"${formData.name}" updated successfully!`, 'success');
      } else {
        await createShoppingListItem({
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
        });
        toast(`"${formData.name}" added to shopping list! 🛒`, 'success');
      }

      loadItems();
      setFormOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to save item.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteShoppingListItem(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast(`"${deleteTarget.name}" removed from shopping list.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to delete item.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Clear purchased items batch handler
  const handleClearPurchased = async () => {
    setClearing(true);
    try {
      await clearPurchasedItems();
      setItems((prev) => prev.filter((i) => !i.isPurchased));
      toast('Purchased items cleared from shopping list.', 'info');
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to clear purchased items.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setCategory('All');
    setPriority('ALL');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Shopping List
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-sage)] mt-1 font-medium">
            Manage your grocery shopping, mark items as bought, and restock your pantry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={loadItems}
            aria-label="Refresh list"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* ── Statistics Overview ── */}
      <ShoppingStats
        totalItems={stats.total}
        purchasedCount={stats.purchased}
        remainingCount={stats.remaining}
        highPriorityCount={stats.highPriority}
        onSelectFilter={(newFilter) => {
          if (newFilter === 'PURCHASED') setStatus('PURCHASED');
          else if (newFilter === 'PENDING') setStatus('PENDING');
          else if (newFilter === 'HIGH_PRIORITY') setPriority('HIGH');
          else {
            setStatus('ALL');
            setPriority('ALL');
          }
        }}
      />

      {/* ── Shopping Summary & Progress ── */}
      {items.length > 0 && (
        <ShoppingSummary
          totalCount={stats.total}
          purchasedCount={stats.purchased}
          onClearPurchased={handleClearPurchased}
          clearing={clearing}
        />
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-4">
        <ShoppingSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by grocery item name..."
        />

        <ShoppingFilters
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          priority={priority}
          onPriorityChange={setPriority}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categories={categories}
        />
      </div>

      {/* ── Main Items Content ── */}
      {loading ? (
        <ShoppingSkeleton view={viewMode} count={8} />
      ) : items.length === 0 ? (
        <EmptyShoppingList
          onAddItem={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
        />
      ) : processedItems.length === 0 ? (
        <EmptyShoppingList
          isFiltered
          onAddItem={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'table' ? (
        <ShoppingTable
          items={processedItems}
          onTogglePurchased={handleTogglePurchased}
          onEdit={(item) => {
            setEditingItem(item);
            setFormOpen(true);
          }}
          onDelete={setDeleteTarget}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedItems.map((item, idx) => (
              <ShoppingCard
                key={item.id}
                item={item}
                index={idx}
                onTogglePurchased={handleTogglePurchased}
                onEdit={(item) => {
                  setEditingItem(item);
                  setFormOpen(true);
                }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ── Item Form Modal ── */}
      <ShoppingItemForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteItemDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name}
        loading={deleting}
      />
    </div>
  );
};

export default ShoppingList;
