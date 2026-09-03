import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  Edit2,
  Trash2,
  BookOpen,
  Share2,
} from 'lucide-react';

import FavoriteButton from '../../components/recipes/FavoriteButton';
import ServingScaler from '../../components/recipes/ServingScaler';
import PantryMatchCard from '../../components/recipes/PantryMatchCard';
import IngredientList from '../../components/recipes/IngredientList';
import NutritionCard from '../../components/recipes/NutritionCard';
import DeleteRecipeDialog from '../../components/recipes/DeleteRecipeDialog';
import RecipeSkeleton from '../../components/recipes/RecipeSkeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

import {
  getRecipeById,
  getRecipeIngredients,
  getRecipeNutrition,
  deleteRecipe,
  addFavorite,
  removeFavorite,
  getFavoriteStatus,
  getRecipePantryAvailability,
  scaleRecipeServings,
} from '../../services/recipeService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const RecipeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { activePantry } = usePantry();

  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [availability, setAvailability] = useState(null);

  const [servings, setServings] = useState(2);
  const [baseServings, setBaseServings] = useState(2);
  const [scaling, setScaling] = useState(false);

  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRecipeData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [
        recipeRes,
        ingredientsRes,
        nutritionRes,
        favStatusRes,
      ] = await Promise.allSettled([
        getRecipeById(id),
        getRecipeIngredients(id),
        getRecipeNutrition(id),
        getFavoriteStatus(id),
      ]);

      const recipeData =
        recipeRes.status === 'fulfilled'
          ? recipeRes.value.data.data?.recipe || recipeRes.value.data.data
          : null;

      const ingredientsData =
        ingredientsRes.status === 'fulfilled'
          ? ingredientsRes.value.data.data?.ingredients || ingredientsRes.value.data.data || []
          : [];

      const nutritionData =
        nutritionRes.status === 'fulfilled'
          ? nutritionRes.value.data.data?.nutrition || nutritionRes.value.data.data
          : null;

      const favData =
        favStatusRes.status === 'fulfilled'
          ? favStatusRes.value.data.data?.isFavorite || favStatusRes.value.data.data
          : false;

      if (recipeData) {
        setRecipe(recipeData);
        setBaseServings(recipeData.servings || 2);
        setServings(recipeData.servings || 2);
      }

      setIngredients(ingredientsData);
      setNutrition(nutritionData);
      setIsFavorite(Boolean(favData));
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to load recipe.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecipeData();
  }, [loadRecipeData]);

  // Pantry availability matching
  useEffect(() => {
    if (!id || !activePantry?.id) return;
    getRecipePantryAvailability(id, activePantry.id, servings)
      .then((res) => {
        setAvailability(res.data.data);
      })
      .catch(() => {
        setAvailability(null);
      });
  }, [id, activePantry, servings]);

  // Handle serving scale change
  const handleScaleChange = async (newServings) => {
    setServings(newServings);
    if (!id) return;

    setScaling(true);
    try {
      const res = await scaleRecipeServings(id, newServings);
      if (res.data.data?.ingredients) {
        setIngredients(res.data.data.ingredients);
      }
    } catch {
      // Local dynamic scaling calculation fallback is handled inside IngredientList
    } finally {
      setScaling(false);
    }
  };

  // Favorite toggle
  const handleFavoriteToggle = async () => {
    if (!id) return;
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      if (nextState) {
        await addFavorite(id);
        toast('Added to favorites! ❤️', 'success');
      } else {
        await removeFavorite(id);
        toast('Removed from favorites.', 'info');
      }
    } catch (err) {
      setIsFavorite(!nextState);
      toast(getErrorMessage(err) || 'Failed to update favorite status.', 'error');
    }
  };

  // Delete recipe
  const handleDeleteConfirm = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteRecipe(id);
      toast(`Recipe deleted.`, 'info');
      navigate('/recipes');
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to delete recipe.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <RecipeSkeleton view="details" />;
  }

  if (!recipe) {
    return (
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-12 text-center max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-[var(--color-dark)]">Recipe Not Found</h2>
        <p className="text-xs text-[var(--color-sage)]">
          The requested recipe could not be found or may have been deleted.
        </p>
        <Button variant="primary" onClick={() => navigate('/recipes')}>
          Back to Recipes
        </Button>
      </div>
    );
  }

  const title = recipe.title || recipe.name || 'Untitled Recipe';
  const prepTime = recipe.prepTime || 0;
  const cookTime = recipe.cookTime || 0;
  const totalTime = prepTime + cookTime || cookTime || prepTime;
  const difficulty = recipe.difficulty || 'MEDIUM';

  const difficultyVariant =
    difficulty.toUpperCase() === 'EASY'
      ? 'success'
      : difficulty.toUpperCase() === 'HARD'
      ? 'danger'
      : 'warning';

  const instructionsList = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : typeof recipe.instructions === 'string'
    ? recipe.instructions.split('\n').filter(Boolean)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
    >
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/recipes')}
          className="flex items-center gap-2 text-xs font-bold text-[var(--color-sage)] hover:text-[var(--color-dark)] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Recipes</span>
        </button>

        <div className="flex items-center gap-2">
          <FavoriteButton
            isFavorite={isFavorite}
            onClick={handleFavoriteToggle}
            size="md"
          />
          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={() => navigate(`/recipes/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/cooking/${id}`)}
          >
            Start Cooking
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete recipe"
          />
        </div>
      </div>

      {/* ── Hero Overview Card / Image Placeholder ── */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] overflow-hidden shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        {/* Banner Area */}
        <div className="h-44 bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.12)] p-6 flex flex-col justify-between relative">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={difficultyVariant} size="md">
              {difficulty}
            </Badge>
            {recipe.cuisine && (
              <span className="badge badge-neutral text-xs font-bold">
                {recipe.cuisine}
              </span>
            )}
            {recipe.category && (
              <span className="badge badge-neutral text-xs font-semibold">
                {recipe.category}
              </span>
            )}
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white text-[var(--color-sage)] flex items-center justify-center shadow-sm">
            <ChefHat size={24} />
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-8 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight leading-tight">
              {title}
            </h1>
            {recipe.description && (
              <p className="text-sm text-[var(--color-sage)] mt-2 leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Quick timing & specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[rgba(138,144,112,0.12)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-sage)]">
              <Clock size={15} />
              <span>Prep: <strong className="text-[var(--color-dark)]">{prepTime}m</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-sage)]">
              <ChefHat size={15} />
              <span>Cook: <strong className="text-[var(--color-dark)]">{cookTime}m</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-sage)]">
              <Clock size={15} />
              <span>Total: <strong className="text-[var(--color-dark)]">{totalTime}m</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-sage)]">
              <Users size={15} />
              <span>Base: <strong className="text-[var(--color-dark)]">{baseServings} srv</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Serving Scaler ── */}
      <ServingScaler
        servings={servings}
        onChange={handleScaleChange}
        disabled={scaling}
      />

      {/* ── Pantry Availability Match ── */}
      <PantryMatchCard
        availability={availability}
        pantryName={activePantry?.name || 'My Kitchen Pantry'}
      />

      {/* ── Grid: Ingredients & Nutrition ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Ingredients */}
        <IngredientList
          ingredients={ingredients}
          servings={servings}
          baseServings={baseServings}
        />

        {/* Nutrition */}
        <NutritionCard nutrition={nutrition} servings={servings} />
      </div>

      {/* ── Instructions Section ── */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <BookOpen size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--color-dark)] leading-tight">
              Cooking Instructions
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">
              {instructionsList.length} step{instructionsList.length !== 1 ? 's' : ''} to culinary perfection
            </p>
          </div>
        </div>

        {instructionsList.length === 0 ? (
          <p className="text-xs text-[var(--color-sage)] py-4 text-center">
            No instructions provided for this recipe.
          </p>
        ) : (
          <ol className="space-y-4">
            {instructionsList.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3.5 p-3 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.10)]"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--color-sage)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm text-[var(--color-dark)] leading-relaxed font-medium">
                  {typeof step === 'string' ? step : step.description}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteRecipeDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        recipeTitle={title}
        loading={deleting}
      />
    </motion.div>
  );
};

export default RecipeDetails;
