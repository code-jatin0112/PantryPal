import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createPantryItem, updatePantryItem, deletePantryItem } from '../services/pantryService';
import { usePantry } from '../hooks/usePantry';
import { useToast } from '../context/ToastContext';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { formatIngredientQuantity } from '../utils/hoistingDemo';
import { 
  Plus, Trash2, Edit2, X, AlertTriangle, 
  Package, TrendingDown, Calendar, RefreshCw, CheckCircle
} from 'lucide-react';

// ─── Add/Edit Item Modal ─────────────────────────────────────────────────────
const ItemModal = ({ pantryId, editItem, onClose, onSuccess }) => {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: editItem ? {
      name: editItem.name,
      quantity: editItem.quantity,
      unit: editItem.unit,
      category: editItem.category || '',
      expirationDate: editItem.expirationDate ? editItem.expirationDate.split('T')[0] : '',
      minimumQuantity: editItem.minimumQuantity || '',
    } : {}
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        quantity: parseFloat(data.quantity),
        unit: data.unit,
        category: data.category || undefined,
        expirationDate: data.expirationDate || undefined,
        minimumQuantity: data.minimumQuantity ? parseFloat(data.minimumQuantity) : undefined,
      };
      if (editItem) {
        await updatePantryItem(pantryId, editItem.id, payload);
        toast(`"${payload.name}" updated successfully.`, 'success');
      } else {
        await createPantryItem(pantryId, payload);
        toast(`"${payload.name}" added to your pantry!`, 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast('Failed to save item. Please try again.', 'error');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-sage hover:text-bark transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-bark mb-6">
          {editItem ? 'Edit Ingredient' : 'Add Ingredient'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-bark mb-1">Name *</label>
              <input {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
                placeholder="e.g. Tomatoes"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Quantity *</label>
              <input type="number" step="0.01" {...register('quantity', { required: 'Required' })}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
                placeholder="2"
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Unit *</label>
              <select {...register('unit', { required: 'Required' })}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm bg-white"
              >
                <option value="">Select...</option>
                {['kg', 'g', 'lbs', 'oz', 'L', 'ml', 'cups', 'pieces', 'units'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Category</label>
              <select {...register('category')}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm bg-white"
              >
                <option value="">None</option>
                {['Produce', 'Dairy', 'Meat', 'Seafood', 'Grains', 'Spices', 'Beverages', 'Snacks', 'Frozen', 'Canned', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Min. Stock</label>
              <input type="number" step="0.01" {...register('minimumQuantity')}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
                placeholder="Alert threshold"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-bark mb-1">Expiration Date</label>
              <input type="date" {...register('expirationDate')}
                className="w-full px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-sage/30 text-sage font-medium text-sm hover:bg-sage/10 transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-sage text-white font-medium text-sm hover:bg-bark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : editItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Alert Badge ─────────────────────────────────────────────────────────────
const AlertBadge = ({ count, icon: Icon, label, color }) => {
  if (count === 0) return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${color}`}>
      <Icon size={16} />
      <span>{count} {label}</span>
    </div>
  );
};

// ─── Item Card ───────────────────────────────────────────────────────────────
const ItemCard = ({ item, pantryId, onRefresh }) => {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const isExpiring = item.expirationDate && (() => {
    const days = (new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  })();

  const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();
  const isLowStock = item.minimumQuantity && item.quantity <= item.minimumQuantity;

  const handleDelete = async () => {
    if (!window.confirm(`Remove "${item.name}" from your pantry?`)) return;
    setDeleting(true);
    try {
      await deletePantryItem(pantryId, item.id);
      toast(`"${item.name}" removed from pantry.`, 'info');
      onRefresh();
    } catch (err) {
      toast('Failed to remove item.', 'error');
      console.error(err);
      setDeleting(false);
    }
  };

  return (
    <>
      {editing && (
        <ItemModal
          pantryId={pantryId}
          editItem={item}
          onClose={() => setEditing(false)}
          onSuccess={onRefresh}
        />
      )}
      <div className={`group bg-white rounded-2xl border p-4 hover:shadow-md transition-all duration-200 ${
        isExpired ? 'border-red-200 bg-red-50/30' :
        isExpiring ? 'border-amber-200 bg-amber-50/30' :
        isLowStock ? 'border-orange-200 bg-orange-50/30' :
        'border-sage/20'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-bark truncate text-sm">{item.name}</h3>
            {item.category && (
              <span className="text-xs text-sage bg-olive/20 px-2 py-0.5 rounded-full">{item.category}</span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg hover:bg-olive/20 text-sage hover:text-bark transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="p-1.5 rounded-lg hover:bg-red-50 text-sage hover:text-red-500 transition-colors disabled:opacity-50">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="text-2xl font-bold text-bark mb-1">
          {formatIngredientQuantity(item.quantity, item.unit)}
        </div>

        <div className="space-y-1 mt-2">
          {isExpired && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertTriangle size={12} /> Expired
            </div>
          )}
          {isExpiring && !isExpired && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <Calendar size={12} /> Expires {new Date(item.expirationDate).toLocaleDateString()}
            </div>
          )}
          {isLowStock && (
            <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
              <TrendingDown size={12} /> Low stock (min: {item.minimumQuantity} {item.unit})
            </div>
          )}
          {!isExpired && !isExpiring && !isLowStock && item.expirationDate && (
            <div className="flex items-center gap-1.5 text-xs text-sage">
              <CheckCircle size={12} className="text-green-500" />
              {new Date(item.expirationDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Main Pantry Page ─────────────────────────────────────────────────────────
const Pantry = () => {
  const {
    pantries, activePantry, setActivePantry,
    items, expiringItems, lowStockItems,
    loading, error, refresh, fetchPantries,
  } = usePantry();

  const [showAddItem, setShowAddItem] = useState(false);
  const [search, debouncedSearch, setSearch] = useDebouncedSearch('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-bark">My Pantry</h1>
          <p className="text-sage text-sm mt-1">{items.length} ingredients tracked</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh}
            className="p-2.5 rounded-xl border border-sage/30 text-sage hover:text-bark hover:border-bark transition-colors">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sage text-white rounded-xl hover:bg-bark transition-colors font-medium text-sm shadow-md"
          >
            <Plus size={18} /> Add Ingredient
          </button>
        </div>
      </div>

      {/* Alerts Bar */}
      {(expiringItems.length > 0 || lowStockItems.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <span className="text-sm font-semibold text-amber-800 mr-2 self-center">⚠️ Alerts:</span>
          <AlertBadge count={expiringItems.length} icon={Calendar} label="expiring soon" color="bg-amber-100 text-amber-800" />
          <AlertBadge count={lowStockItems.length} icon={TrendingDown} label="low stock" color="bg-orange-100 text-orange-800" />
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ingredients..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
        />
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-sage text-white'
                  : 'border border-sage/30 text-sage hover:border-bark hover:text-bark'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-sage/10 p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sage/20 p-6">
          <Package size={44} className="mx-auto text-olive mb-3" />
          <h3 className="text-lg font-bold text-bark mb-1">
            {search ? `No ingredients matching "${search}"` : 'Your pantry is empty'}
          </h3>
          <p className="text-sage text-sm mb-5">
            {search ? 'Try clearing your search or filter.' : 'Add your first ingredient to start tracking stock and generating AI recipes!'}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddItem(true)}
              className="px-5 py-2.5 bg-sage text-white rounded-xl hover:bg-bark transition-colors font-medium text-sm shadow-sm inline-flex items-center gap-2"
            >
              <Plus size={16} /> Add First Ingredient
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map(item => (
            <ItemCard key={item.id} item={item} pantryId={activePantry?.id} onRefresh={refresh} />
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && activePantry && (
        <ItemModal
          pantryId={activePantry.id}
          editItem={null}
          onClose={() => setShowAddItem(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
};

export default Pantry;
