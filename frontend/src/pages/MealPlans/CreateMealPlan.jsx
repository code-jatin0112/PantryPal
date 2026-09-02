import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import MealPlanForm from '../../components/mealPlans/MealPlanForm';
import { createMealPlan } from '../../services/mealPlanService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const CreateMealPlan = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await createMealPlan(formData);
      const newPlan = res.data.data?.mealPlan || res.data.data;
      toast(`"${formData.name}" created successfully! 📅`, 'success');

      if (newPlan?.id) {
        navigate(`/meal-plans/${newPlan.id}`);
      } else {
        navigate('/meal-plans');
      }
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to create meal plan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
        onClick={() => navigate('/meal-plans')}
        className="flex items-center gap-2 text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Meal Plans</span>
      </button>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <CalendarPlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Create Meal Plan
            </h1>
            <p className="text-xs text-[var(--color-sage)]">
              Schedule recipes across days, balance nutrition, and evaluate grocery costs
            </p>
          </div>
        </div>

        <MealPlanForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/meal-plans')}
          loading={submitting}
          submitLabel="Create Meal Plan"
        />
      </div>
    </motion.div>
  );
};

export default CreateMealPlan;
