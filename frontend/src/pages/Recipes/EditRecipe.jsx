import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3 } from 'lucide-react';
import RecipeForm from '../../components/recipes/RecipeForm';
import {
  getRecipeById,
  updateRecipe,
  getRecipeIngredients,
  getRecipeNutrition,
  addRecipeIngredient,
  deleteRecipeIngredient,
  updateRecipeNutrition,
} from '../../services/recipeService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';
import Spinner from '../../components/ui/Spinner';

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchRecipeDetails = async () => {
      setLoading(true);
      try {
        const [recipeRes, ingredientsRes, nutritionRes] = await Promise.allSettled([
          getRecipeById(id),
          getRecipeIngredients(id),
          getRecipeNutrition(id),
        ]);

        const recipe =
          recipeRes.status === 'fulfilled'
            ? recipeRes.value.data.data?.recipe || recipeRes.value.data.data
            : null;

        const ingredients =
          ingredientsRes.status === 'fulfilled'
            ? ingredientsRes.value.data.data?.ingredients || ingredientsRes.value.data.data || []
            : [];

        const nutrition =
          nutritionRes.status === 'fulfilled'
            ? nutritionRes.value.data.data?.nutrition || nutritionRes.value.data.data
            : null;

        if (recipe) {
          setRecipeData({
            ...recipe,
            ingredients,
            nutrition,
          });
        }
      } catch (err) {
        toast(getErrorMessage(err) || 'Failed to load recipe details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id]);

  const handleSubmit = async (formData) => {
    if (!id) return;
    setSubmitting(true);
    try {
      // 1. Update main recipe fields
      await updateRecipe(id, {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        servings: formData.servings,
      });

      // 2. Update nutrition if provided
      if (formData.nutrition && (formData.nutrition.calories || formData.nutrition.protein)) {
        await updateRecipeNutrition(id, formData.nutrition).catch(() => {});
      }

      toast(`"${formData.title}" updated successfully!`, 'success');
      navigate(`/recipes/${id}`);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to update recipe.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Spinner center label="Loading recipe details..." />
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
        onClick={() => navigate(`/recipes/${id}`)}
        className="flex items-center gap-2 text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Recipe Details</span>
      </button>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Edit3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Edit Recipe
            </h1>
            <p className="text-xs text-[var(--color-sage)]">
              Modify ingredients, timing, instructions, or nutritional data
            </p>
          </div>
        </div>

        <RecipeForm
          initialData={recipeData}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/recipes/${id}`)}
          loading={submitting}
          submitLabel="Save Changes"
        />
      </div>
    </motion.div>
  );
};

export default EditRecipe;
