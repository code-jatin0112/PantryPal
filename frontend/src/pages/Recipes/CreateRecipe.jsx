import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookPlus } from 'lucide-react';
import RecipeForm from '../../components/recipes/RecipeForm';
import { createRecipe, addRecipeIngredient, updateRecipeNutrition } from '../../services/recipeService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const CreateRecipe = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // 1. Create main recipe
      const createRes = await createRecipe({
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        servings: formData.servings,
      });

      const newRecipe = createRes.data.data?.recipe || createRes.data.data;
      const recipeId = newRecipe?.id;

      if (recipeId) {
        // 2. Add ingredients if provided
        if (formData.ingredients && formData.ingredients.length > 0) {
          await Promise.allSettled(
            formData.ingredients.map((ing) =>
              addRecipeIngredient(recipeId, {
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
              })
            )
          );
        }

        // 3. Add nutrition if provided
        if (formData.nutrition && (formData.nutrition.calories || formData.nutrition.protein)) {
          await updateRecipeNutrition(recipeId, formData.nutrition).catch(() => {});
        }
      }

      toast(`"${formData.title}" created successfully! 🍳`, 'success');
      navigate('/recipes');
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to create recipe.', 'error');
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
        onClick={() => navigate('/recipes')}
        className="flex items-center gap-2 text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Recipes</span>
      </button>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <BookPlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Create New Recipe
            </h1>
            <p className="text-xs text-[var(--color-sage)]">
              Document your culinary creation with step-by-step instructions
            </p>
          </div>
        </div>

        <RecipeForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/recipes')}
          loading={submitting}
          submitLabel="Create Recipe"
        />
      </div>
    </motion.div>
  );
};

export default CreateRecipe;
