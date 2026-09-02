import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3 } from 'lucide-react';
import MealPlanForm from '../../components/mealPlans/MealPlanForm';
import { getMealPlanById, updateMealPlan } from '../../services/mealPlanService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';
import Spinner from '../../components/ui/Spinner';

const EditMealPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMealPlanById(id)
      .then((res) => {
        const data = res.data.data?.mealPlan || res.data.data;
        setMealPlan(data);
      })
      .catch((err) => {
        toast(getErrorMessage(err) || 'Failed to load meal plan.', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (formData) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateMealPlan(id, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        peopleCount: formData.peopleCount,
        budget: formData.budget,
      });

      toast(`"${formData.name}" updated successfully!`, 'success');
      navigate(`/meal-plans/${id}`);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to update meal plan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Spinner center label="Loading meal plan details..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(`/meal-plans/${id}`)}
        className="flex items-center gap-2 text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Meal Plan Details</span>
      </button>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Edit3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Edit Meal Plan
            </h1>
            <p className="text-xs text-[var(--color-sage)]">
              Modify scheduling, guest headcount, or budget parameters
            </p>
          </div>
        </div>

        <MealPlanForm
          initialData={mealPlan}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/meal-plans/${id}`)}
          loading={submitting}
          submitLabel="Save Changes"
        />
      </div>
    </motion.div>
  );
};

export default EditMealPlan;
