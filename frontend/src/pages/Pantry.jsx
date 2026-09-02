import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { createPantryItem, updatePantryItem, deletePantryItem } from '../services/pantryService';
import { usePantry } from '../hooks/usePantry';
import { useToast } from '../context/ToastContext';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { formatIngredientQuantity } from '../utils/hoistingDemo';
import { getErrorMessage } from '../utils/errorHandler';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { PANTRY_CATEGORIES, PANTRY_UNITS } from '../constants/api';
import {
  Plus, Trash2, Edit2, AlertTriangle,
  Package, TrendingDown, Calendar, RefreshCw, CheckCircle2, Search,
} from 'lucide-react';

// ── Item Form ─────────────────────────────────────────────
const ItemForm = ({ editItem, onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: editItem ? {
      name:            editItem.name,
      quantity:        editItem.quantity,
      unit:            editItem.unit,
      category:        editItem.category || '',
      expirationDate:  editItem.expirationDate ? editItem.expirationDate.split('T')[0] : '',
      minimumQuantity: editItem.minimumQuantity || '',
    } : {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[var(--color-dark)]">Name *</label>
        <input
          autoFocus
          className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="e.g. Tomatoes"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
      </div>

      {/* Qty + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-dark)]">Quantity *</label>
          <input type="number" step="0.01" min="0" className={`input ${errors.quantity ? 'input-error' : ''}`}
            placeholder="2" {...register('quantity', { required: 'Required' })} />
          {errors.quantity && <p className="text-xs text-[var(--color-danger)]">{errors.quantity.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-dark)]">Unit *</label>
          <select className={`input py-2.5 px-4 text-sm bg-white ${errors.unit ? 'input-error' : ''}`}
            {...register('unit', { required: 'Required' })}>
            <option value="">Select…</option>
            {PANTRY_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.unit && <p className="text-xs text-[var(--color-danger)]">{errors.unit.message}</p>}
        </div>
      </div>

      {/* Category + Min Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-dark)]">Category</label>
          <select className="input py-2.5 px-4 text-sm bg-white" {...register('category')}>
            <option value="">None</option>
            {PANTRY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-dark)]">Min. Stock</label>
          <input type="number" step="0.01" min="0" className="input"
            placeholder="Alert threshold" {...register('minimumQuantity')} />
        </div>
      </div>

      {/* Expiration */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[var(--color-dark)]">Expiration Date</label>
        <input type="date" className="input" {...register('expirationDate')} />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          {editItem ? 'Save Changes' : 'Add Ingredient'}
        </Button>
      </div>
    </form>
  );
};

// ── Item Card ─────────────────────────────────────────────
const ItemCard = ({ item, pantryId, onRefresh, index }) => {
  const toast = useToast();
  const [editing, setEditing]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving]     = useState(false);

  const daysLeft = item.expirationDate
    ? Math.ceil((new Date(item.expirationDate) - new Date()) / 86400000)
    : null;
  const isExpired  = daysLeft !== null && daysLeft < 0;
  const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isLowStock = item.minimumQuantity && item.quantity <= item.minimumQuantity;

  const borderStyle = isExpired  ? 'border-[var(--color-danger)] border-opacity-30 bg-[var(--color-danger-bg)]' :
                      isExpiring ? 'border-[var(--color-warning)] border-opacity-30 bg-[var(--color-warning-bg)]' :
                      isLowStock ? 'border-orange-200 bg-orange-50' :
                      'border-[rgba(138,144,112,0.15)] bg-white';

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        name:            data.name,
        quantity:        parseFloat(data.quantity),
        unit:            data.unit,
        category:        data.category || undefined,
        expirationDate:  data.expirationDate || undefined,
        minimumQuantity: data.minimumQuantity ? parseFloat(data.minimumQuantity) : undefined,
      };
      await updatePantryItem(pantryId, item.id, payload);
      toast(`"${payload.name}" updated.`, 'success');
      onRefresh();
      setEditing(false);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(false); // close confirm before deletion
    try {
      await deletePantryItem(pantryId, item.id);
      toast(`"${item.name}" removed.`, 'info');
      onRefresh();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className={`group relative rounded-2xl border p-4 card-hover transition-colors ${borderStyle}`}
      >
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors shadow-sm">
            <Edit2 size={13} />
          </button>
          <button onClick={() => setDeleting(true)}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[var(--color-sage)] hover:text-red-500 transition-colors shadow-sm">
            <Trash2 size={13} />
          </button>
        </div>

        {/* Name */}
        <h3 className="font-bold text-[var(--color-dark)] text-sm leading-tight pr-14 mb-1 line-clamp-2">{item.name}</h3>

        {/* Category */}
        {item.category && (
          <span className="badge badge-neutral text-[10px] mb-2 inline-block">{item.category}</span>
        )}

        {/* Quantity */}
        <p className="text-xl font-extrabold text-[var(--color-dark)] tabular-nums mt-2 mb-2">
          {formatIngredientQuantity(item.quantity, item.unit)}
        </p>

        {/* Status */}
        <div className="space-y-1">
          {isExpired  && <div className="flex items-center gap-1.5 text-xs text-[var(--color-danger)] font-semibold"><AlertTriangle size={11} /> Expired</div>}
          {isExpiring && !isExpired && <div className="flex items-center gap-1.5 text-xs text-[var(--color-warning)] font-semibold"><Calendar size={11} /> {daysLeft}d left</div>}
          {isLowStock && <div className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold"><TrendingDown size={11} /> Low stock</div>}
          {!isExpired && !isExpiring && !isLowStock && item.expirationDate && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-sage)]">
              <CheckCircle2 size={11} className="text-[var(--color-success)]" />
              {new Date(item.expirationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Ingredient">
        <ItemForm editItem={item} onSubmit={handleEdit} loading={saving} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={handleDelete}
        title="Remove ingredient?"
        description={`"${item.name}" will be permanently removed from your pantry.`}
        confirmLabel="Remove"
      />
    </>
  );
};

// ── Main Pantry Page ──────────────────────────────────────
const Pantry = () => {
  const {
    activePantry, items, expiringItems, lowStockItems,
    loading, error, refresh,
  } = usePantry();
  const toast = useToast();

  const [showAdd, setShowAdd]     = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [search, debouncedSearch, setSearch] = useDebouncedSearch('');
  const [categoryFilter, setCategoryFilter]  = useState('All');

  const categories = ['All', ...new Set(items.map((i) => i.category).filter(Boolean))];

  const filtered = items.filter((item) => {
    const matchSearch   = item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleAdd = async (data) => {
    if (!activePantry) return;
    setAddSaving(true);
    try {
      const payload = {
        name:            data.name,
        quantity:        parseFloat(data.quantity),
        unit:            data.unit,
        category:        data.category || undefined,
        expirationDate:  data.expirationDate || undefined,
        minimumQuantity: data.minimumQuantity ? parseFloat(data.minimumQuantity) : undefined,
      };
      await createPantryItem(activePantry.id, payload);
      toast(`"${payload.name}" added to pantry! ✅`, 'success');
      refresh();
      setShowAdd(false);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 gap-4 flex-wrap"
      >
        <div>
          <h1 className="page-title">My Pantry</h1>
          <p className="page-subtitle">
            {items.length} ingredient{items.length !== 1 ? 's' : ''} tracked
            {expiringItems.length > 0 && ` · ${expiringItems.length} expiring`}
            {lowStockItems.length > 0 && ` · ${lowStockItems.length} low stock`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refresh} />
          <Button variant="primary" icon={Plus} onClick={() => setShowAdd(true)}>
            Add Ingredient
          </Button>
        </div>
      </motion.div>

      {/* Alerts bar */}
      {(expiringItems.length > 0 || lowStockItems.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 p-4 bg-[var(--color-warning-bg)] border border-[rgba(217,164,65,0.3)] rounded-2xl mb-6"
        >
          <span className="text-sm font-bold text-[var(--color-warning)] flex items-center gap-2">
            <AlertTriangle size={15} /> Alerts
          </span>
          {expiringItems.length > 0 && (
            <Badge variant="warning" dot>{expiringItems.length} expiring soon</Badge>
          )}
          {lowStockItems.length > 0 && (
            <Badge variant="warning" dot>{lowStockItems.length} low stock</Badge>
          )}
        </motion.div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients…"
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-[var(--color-sage)] text-white shadow-sm'
                  : 'border border-[rgba(138,144,112,0.25)] text-[var(--color-sage)] hover:border-[var(--color-bark)] hover:text-[var(--color-bark)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title={debouncedSearch ? `No results for "${debouncedSearch}"` : 'Your pantry is empty'}
            description={debouncedSearch ? 'Try clearing your search.' : 'Add your first ingredient to start tracking stock and getting AI recipe suggestions.'}
            action={!debouncedSearch ? { label: 'Add First Ingredient', icon: Plus, onClick: () => setShowAdd(true) } : undefined}
          />
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((item, i) => (
              <ItemCard key={item.id} item={item} pantryId={activePantry?.id} onRefresh={refresh} index={i} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Ingredient">
        <ItemForm onSubmit={handleAdd} loading={addSaving} />
      </Modal>
    </div>
  );
};

export default Pantry;
