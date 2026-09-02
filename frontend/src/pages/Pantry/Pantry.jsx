import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

import PantryStats from '../../components/pantry/PantryStats';
import PantrySearch from '../../components/pantry/PantrySearch';
import PantryFilters from '../../components/pantry/PantryFilters';
import PantryCard from '../../components/pantry/PantryCard';
import PantryTable from '../../components/pantry/PantryTable';
import PantryModal from '../../components/pantry/PantryModal';
import DeleteDialog from '../../components/pantry/DeleteDialog';
import EmptyPantry from '../../components/pantry/EmptyPantry';
import LoadingSkeleton from '../../components/pantry/LoadingSkeleton';
import Button from '../../components/ui/Button';

import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import {
  createPantryItem,
  updatePantryItem,
  deletePantryItem,
  adjustStock,
} from '../../services/pantryService';
import { getErrorMessage } from '../../utils/errorHandler';
import { getExpiryStatus } from '../../components/pantry/ExpiryBadge';

const Pantry = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    activePantry,
    items,
    expiringItems,
    lowStockItems,
    loading,
    error,
    refresh,
  } = usePantry();

  // Search & Filters State
  const [search, debouncedSearch, setSearch] = useDebouncedSearch('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal & Dialog States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Expired Items count
  const expiredCount = useMemo(() => {
    return items.filter((i) => {
      const exp = i.expiryDate || i.expirationDate;
      if (!exp) return false;
      return new Date(exp) < new Date();
    }).length;
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
        // Search filter (name or category)
        const q = debouncedSearch.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        const matchesSearch = !q || matchesName || matchesCat;

        // Category filter
        const matchesCategory = category === 'All' || item.category === category;

        // Status filter
        let matchesStatus = true;
        const expiryInfo = getExpiryStatus(item.expiryDate || item.expirationDate);
        const isLow = item.quantity !== undefined && item.quantity <= (item.minimumQuantity || 1);

        if (status === 'FRESH') {
          matchesStatus = expiryInfo.status === 'FRESH';
        } else if (status === 'EXPIRING_SOON') {
          matchesStatus = expiryInfo.status === 'EXPIRING_SOON';
        } else if (status === 'EXPIRED') {
          matchesStatus = expiryInfo.status === 'EXPIRED';
        } else if (status === 'LOW_STOCK') {
          matchesStatus = isLow;
        }

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name_desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        if (sortBy === 'quantity_desc') {
          return (b.quantity || 0) - (a.quantity || 0);
        }
        if (sortBy === 'expiry_asc') {
          const expA = a.expiryDate || a.expirationDate || '9999-12-31';
          const expB = b.expiryDate || b.expirationDate || '9999-12-31';
          return new Date(expA) - new Date(expB);
        }
        return 0;
      });
  }, [items, debouncedSearch, category, status, sortBy]);

  // Actions
  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSaveModal = async (formData) => {
    if (!activePantry?.id) return;

    setModalLoading(true);
    try {
      const payload = {
        name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
        category: formData.category || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        minimumQuantity: formData.minimumQuantity || undefined,
      };

      if (editingItem) {
        await updatePantryItem(activePantry.id, editingItem.id, payload);
        toast(`"${payload.name}" updated successfully!`, 'success');
      } else {
        await createPantryItem(activePantry.id, payload);
        toast(`"${payload.name}" added to pantry!`, 'success');
      }

      refresh();
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to save ingredient.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activePantry?.id || !deleteTarget) return;

    setDeleting(true);
    try {
      await deletePantryItem(activePantry.id, deleteTarget.id);
      toast(`"${deleteTarget.name}" deleted.`, 'info');
      refresh();
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to delete ingredient.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAdjustStock = async (item, delta) => {
    if (!activePantry?.id || !item.id) return;
    try {
      await adjustStock(activePantry.id, item.id, { change: delta });
      refresh();
    } catch {
      // Fallback local edit if adjust endpoint has specific limits
      try {
        const nextQty = Math.max(0, (item.quantity || 0) + delta);
        await updatePantryItem(activePantry.id, item.id, { quantity: nextQty });
        refresh();
      } catch (err) {
        toast('Could not adjust stock.', 'error');
      }
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('ALL');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Pantry Inventory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-sage)] mt-1 font-medium">
            Track ingredient stock, shelf life, and avoid unnecessary food waste
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={refresh}
            aria-label="Refresh pantry"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* ── Statistics Overview ── */}
      <PantryStats
        totalItems={items.length}
        expiringCount={expiringItems.length}
        expiredCount={expiredCount}
        lowStockCount={lowStockItems.length}
        onSelectFilter={(newStatus) => setStatus(newStatus)}
      />

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-4">
        <PantrySearch
          value={search}
          onChange={setSearch}
          placeholder="Search by ingredient name or category..."
        />

        <PantryFilters
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categories={categories}
        />
      </div>

      {/* ── Main Inventory Content ── */}
      {loading ? (
        <LoadingSkeleton viewMode={viewMode} count={8} />
      ) : error ? (
        <div className="bg-white rounded-2xl border border-[var(--color-danger)] border-opacity-30 p-8 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-[var(--color-danger)]" />
          <h3 className="font-bold text-[var(--color-dark)]">Failed to load pantry items</h3>
          <p className="text-xs text-[var(--color-sage)]">{error}</p>
          <Button variant="secondary" size="sm" onClick={refresh}>
            Try Again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyPantry onAddItem={handleOpenAdd} />
      ) : processedItems.length === 0 ? (
        <EmptyPantry
          isFiltered
          onAddItem={handleOpenAdd}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'table' ? (
        <PantryTable
          items={processedItems}
          onEdit={handleOpenEdit}
          onDelete={setDeleteTarget}
          onAdjustStock={handleAdjustStock}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedItems.map((item, idx) => (
              <PantryCard
                key={item.id}
                item={item}
                index={idx}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
                onAdjustStock={handleAdjustStock}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ── Modals & Dialogs ── */}
      <PantryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSubmit={handleSaveModal}
        loading={modalLoading}
      />

      <DeleteDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name}
        loading={deleting}
      />
    </div>
  );
};

export default Pantry;
