import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { SHOPPING, PANTRY_UNITS } from '../constants/api';
import { getErrorMessage } from '../utils/errorHandler';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  ShoppingCart, Plus, Check, Trash2, Circle, CheckCircle2,
  Package, X, Edit2, RefreshCw
} from 'lucide-react';

// ── Add / Edit Item Form ──────────────────────────────────
const ItemForm = ({ initial, onSubmit, loading }) => {
  const [name, setName] = useState(initial?.name || '');
  const [quantity, setQuantity] = useState(initial?.quantity || '');
  const [unit, setUnit] = useState(initial?.unit || 'units');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), quantity: quantity ? parseFloat(quantity) : 1, unit });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[var(--color-dark)]">Item name *</label>
        <input
          autoFocus
          className="input"
          placeholder="e.g. Organic Oats"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-dark)]">Quantity</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className="input"
            placeholder="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-dark)]">Unit</label>
          <select
            className="input py-2.5 px-4 text-sm bg-white"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            {PANTRY_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          {initial ? 'Save Changes' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
};

// ── Shopping Item Row ─────────────────────────────────────
const ItemRow = ({ item, onToggle, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors group ${
      item.isPurchased
        ? 'bg-[rgba(107,163,104,0.06)] border border-[rgba(107,163,104,0.15)]'
        : 'bg-white border border-[rgba(138,144,112,0.12)] hover:border-[rgba(138,144,112,0.25)]'
    }`}
  >
    {/* Toggle checkbox */}
    <button
      onClick={() => onToggle(item)}
      className="flex-shrink-0 transition-transform hover:scale-110"
      aria-label={item.isPurchased ? 'Mark as unpurchased' : 'Mark as purchased'}
    >
      {item.isPurchased
        ? <CheckCircle2 size={20} className="text-[var(--color-success)]" />
        : <Circle size={20} className="text-[rgba(138,144,112,0.4)] hover:text-[var(--color-sage)]" />
      }
    </button>

    {/* Name + qty */}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium leading-tight ${item.isPurchased ? 'line-through text-[var(--color-sage)]' : 'text-[var(--color-dark)]'}`}>
        {item.name}
      </p>
      <p className="text-xs text-[var(--color-sage)] mt-0.5">
        {item.quantity} {item.unit}
      </p>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {!item.isPurchased && (
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-parchment)] text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors"
          aria-label="Edit item"
        >
          <Edit2 size={14} />
        </button>
      )}
      <button
        onClick={() => onDelete(item)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-sage)] hover:text-red-500 transition-colors"
        aria-label="Delete item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </motion.div>
);

// ── Main Shopping List Page ───────────────────────────────
const ShoppingList = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(SHOPPING.LIST);
      setItems(res.data.data.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      const res = await api.post(SHOPPING.CREATE, data);
      setItems((prev) => [...prev, res.data.data.item]);
      toast('Item added to shopping list! 🛒', 'success');
      setShowAdd(false);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      const res = await api.patch(SHOPPING.ITEM(editItem.id), data);
      setItems((prev) => prev.map((i) => i.id === editItem.id ? res.data.data.item : i));
      toast('Item updated.', 'success');
      setEditItem(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await api.patch(SHOPPING.ITEM(item.id), { isPurchased: !item.isPurchased });
      setItems((prev) => prev.map((i) => i.id === item.id ? res.data.data.item : i));
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(SHOPPING.ITEM(deleteTarget.id));
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast(`"${deleteTarget.name}" removed.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearPurchased = async () => {
    const purchased = items.filter((i) => i.isPurchased);
    if (purchased.length === 0) return;
    try {
      await api.delete(SHOPPING.CLEAR_PURCHASED);
      setItems((prev) => prev.filter((i) => !i.isPurchased));
      toast(`${purchased.length} purchased item(s) cleared.`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const pending   = items.filter((i) => !i.isPurchased);
  const purchased = items.filter((i) => i.isPurchased);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Shopping List</h1>
          <p className="page-subtitle">
            {pending.length} item{pending.length !== 1 ? 's' : ''} to buy
            {purchased.length > 0 && ` · ${purchased.length} purchased`}
          </p>
        </div>
        <div className="flex gap-3">
          {purchased.length > 0 && (
            <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClearPurchased}>
              Clear Purchased
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} />
          <Button variant="primary" icon={Plus} onClick={() => setShowAdd(true)}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--color-dark)]">Shopping progress</span>
            <span className="text-sm text-[var(--color-sage)]">
              {purchased.length} / {items.length}
            </span>
          </div>
          <div className="h-2 bg-[rgba(138,144,112,0.15)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-success)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${items.length ? (purchased.length / items.length) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ShoppingCart}
            title="Your shopping list is empty"
            description="Add items you need to buy. Mark them off as you shop!"
            action={{ label: 'Add First Item', icon: Plus, onClick: () => setShowAdd(true) }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending */}
          <div>
            <h2 className="text-xs font-bold text-[var(--color-sage)] uppercase tracking-widest mb-3">
              To Buy ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="card px-5 py-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-[var(--color-success)] mb-2" />
                <p className="text-sm text-[var(--color-sage)] font-medium">All done! 🎉</p>
              </div>
            ) : (
              <motion.div className="space-y-2" layout>
                {pending.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onEdit={setEditItem}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* Purchased */}
          {purchased.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[var(--color-sage)] uppercase tracking-widest mb-3">
                Purchased ({purchased.length})
              </h2>
              <motion.div className="space-y-2" layout>
                {purchased.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onEdit={setEditItem}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add to Shopping List">
        <ItemForm onSubmit={handleAdd} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Item">
        {editItem && (
          <ItemForm initial={editItem} onSubmit={handleEdit} loading={saving} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove item?"
        description={`"${deleteTarget?.name}" will be removed from your shopping list.`}
        confirmLabel="Remove"
      />
    </div>
  );
};

export default ShoppingList;
