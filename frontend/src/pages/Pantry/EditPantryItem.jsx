import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3 } from 'lucide-react';
import PantryForm from '../../components/pantry/PantryForm';
import { updatePantryItem, getPantryItemById } from '../../services/pantryService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';
import Spinner from '../../components/ui/Spinner';

const EditPantryItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { activePantry, items, refresh } = usePantry();

  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Find item from hook state or load from API
    if (items && items.length > 0) {
      const found = items.find((i) => String(i.id) === String(id));
      if (found) {
        setItemData(found);
        setLoading(false);
        return;
      }
    }

    if (activePantry?.id && id) {
      getPantryItemById(activePantry.id, id)
        .then((res) => {
          setItemData(res.data.data?.item || res.data.data);
        })
        .catch((err) => {
          toast(getErrorMessage(err) || 'Could not load ingredient details.', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [activePantry, id, items]);

  const handleSubmit = async (formData) => {
    if (!activePantry?.id || !id) return;

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

      await updatePantryItem(activePantry.id, id, payload);
      toast(`"${payload.name}" updated successfully!`, 'success');
      refresh();
      navigate('/pantry');
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to update ingredient.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Spinner center label="Loading ingredient details..." />
      </div>
    );
  }

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
            <Edit3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Edit Ingredient
            </h1>
            <p className="text-xs text-[var(--color-sage)]">
              Update quantity, expiration date, or stock details
            </p>
          </div>
        </div>

        <PantryForm
          initialData={itemData}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/pantry')}
          loading={submitting}
          submitLabel="Save Changes"
        />
      </div>
    </motion.div>
  );
};

export default EditPantryItem;
