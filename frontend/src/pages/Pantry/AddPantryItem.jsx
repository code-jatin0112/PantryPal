import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import PantryForm from '../../components/pantry/PantryForm';
import { createPantryItem } from '../../services/pantryService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const AddPantryItem = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { activePantry, refresh } = usePantry();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    if (!activePantry?.id) {
      toast('No active pantry container found.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
        category: formData.category || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        minimumQuantity: formData.minimumQuantity || undefined,
      };

      await createPantryItem(activePantry.id, payload);
      toast(`"${payload.name}" added to pantry successfully!`, 'success');
      refresh();
      navigate('/pantry');
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to add item to pantry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Back Link */}
      <button
        type="button"
        onClick={() => navigate('/pantry')}
        className="flex items-center gap-2 text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Pantry</span>
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <PackagePlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Add New Ingredient
            </h1>
            <p className="text-xs text-[var(--color-sage)]">
              Log fresh groceries or pantry staples into your inventory
            </p>
          </div>
        </div>

        <PantryForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/pantry')}
          loading={submitting}
          submitLabel="Add Ingredient"
        />
      </div>
    </motion.div>
  );
};

export default AddPantryItem;
