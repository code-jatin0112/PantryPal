import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Filter, AlertCircle } from 'lucide-react';

import RecommendationScoreBadge from '../../components/recommendations/RecommendationScoreBadge';
import RecommendationCard from '../../components/recommendations/RecommendationCard';
import RecommendationGrid from '../../components/recommendations/RecommendationGrid';
import RecommendationFilters from '../../components/recommendations/RecommendationFilters';
import RecommendationModal from '../../components/recommendations/RecommendationModal';
import RecommendationInsights from '../../components/recommendations/RecommendationInsights';
import RecommendationSkeleton from '../../components/recommendations/RecommendationSkeleton';
import RecommendationEmptyState from '../../components/recommendations/RecommendationEmptyState';
import Button from '../../components/ui/Button';

import { getAIRecommendations } from '../../services/aiRecommendationService';
import { createRecipe, addRecipeIngredient } from '../../services/recipeService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const AIRecommendations = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { activePantry } = usePantry();

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [diet, setDiet] = useState([]);
  const [budget, setBudget] = useState('ALL');
  const [maxTime, setMaxTime] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [cuisine, setCuisine] = useState('ALL');
  const [mealType, setMealType] = useState('All');

  // Load recommendations
  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        pantryId: activePantry?.id || '00000000-0000-0000-0000-000000000000',
        dietaryRequirements: diet.length > 0 ? diet : undefined,
        cuisine: cuisine !== 'ALL' ? cuisine : undefined,
        mealType: mealType !== 'All' ? mealType : undefined,
        maxPrepTime: maxTime !== 'ALL' ? parseInt(maxTime, 10) : undefined,
        budgetPriority: budget !== 'ALL' ? budget : undefined,
      };

      const result = await getAIRecommendations(payload);
      setRecommendations(result || []);
      toast('Generated fresh AI recipe recommendations! ✨', 'success');
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to generate recommendations.');
      toast('Error generating recommendations. Click retry.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activePantry, diet, cuisine, mealType, maxTime, budget]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  // Diet toggle
  const handleDietToggle = (dietOption) => {
    setDiet((prev) =>
      prev.includes(dietOption) ? prev.filter((d) => d !== dietOption) : [...prev, dietOption]
    );
  };

  const handleResetFilters = () => {
    setDiet([]);
    setBudget('ALL');
    setMaxTime('ALL');
    setDifficulty('ALL');
    setCuisine('ALL');
    setMealType('All');
  };

  // Save to Cookbook action
  const handleSaveToCookbook = async (rec) => {
    try {
      const formattedInstructions = Array.isArray(rec.instructions)
        ? rec.instructions.join('\n')
        : rec.instructions || 'Follow step-by-step instructions.';

      const createRes = await createRecipe({
        title: rec.title,
        description: rec.reason || 'AI-recommended recipe tailored to pantry stock.',
        instructions: formattedInstructions,
        prepTime: rec.prepTime,
        cookTime: rec.cookTime,
        servings: rec.servings || 2,
      });

      const newId = createRes.data.data?.recipe?.id || createRes.data.data?.id;

      if (newId && rec.ingredients && rec.ingredients.length > 0) {
        await Promise.allSettled(
          rec.ingredients.map((ing) =>
            addRecipeIngredient(newId, {
              name: typeof ing === 'string' ? ing : ing.name,
              quantity: ing.quantity || 1,
              unit: ing.unit || 'pcs',
            })
          )
        );
      }

      toast(`"${rec.title}" saved to your cookbook! 📖`, 'success');
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to save recipe.', 'error');
    }
  };

  // Cook Now action
  const handleCookNow = (rec) => {
    const id = rec.recipeId || rec.id || 'demo';
    navigate(`/cooking/${id}`);
  };

  // Favorite toggle
  const handleFavoriteToggle = (rec) => {
    const id = rec.recipeId || rec.id;
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast('Removed from favorites.', 'info');
      } else {
        next.add(id);
        toast('Added to favorites! ❤️', 'success');
      }
      return next;
    });
  };

  // Filtered recommendations in memory
  const processedRecommendations = useMemo(() => {
    return recommendations.filter((r) => {
      // Difficulty
      if (difficulty !== 'ALL' && (r.difficulty || 'MEDIUM').toUpperCase() !== difficulty) {
        return false;
      }
      // Cuisine
      if (cuisine !== 'ALL' && (r.cuisine || '').toLowerCase() !== cuisine.toLowerCase()) {
        return false;
      }
      // Meal Type
      if (mealType !== 'All' && (r.mealType || '').toLowerCase() !== mealType.toLowerCase()) {
        return false;
      }
      // Max Time
      if (maxTime !== 'ALL') {
        const total = (r.prepTime || 0) + (r.cookTime || 0);
        if (total > parseInt(maxTime, 10)) return false;
      }
      // Budget
      if (budget !== 'ALL' && (r.budgetPriority || 'medium').toLowerCase() !== budget.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [recommendations, difficulty, cuisine, mealType, maxTime, budget]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center">
              <Sparkles size={16} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
              AI Recipe Recommendations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-sage)] mt-1 font-medium max-w-2xl">
            Get personalized recipe suggestions based on your pantry, preferences, dietary restrictions, allergies, nutrition goals, and budget.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="md"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            loading={loading}
            onClick={generateRecommendations}
            aria-label="Refresh recommendations"
          />

          <Button
            variant="primary"
            size="md"
            icon={Sparkles}
            loading={loading}
            onClick={generateRecommendations}
          >
            Generate Recommendations
          </Button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <RecommendationFilters
            diet={diet}
            onDietToggle={handleDietToggle}
            budget={budget}
            onBudgetChange={setBudget}
            maxTime={maxTime}
            onMaxTimeChange={setMaxTime}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            cuisine={cuisine}
            onCuisineChange={setCuisine}
            mealType={mealType}
            onMealTypeChange={setMealType}
            onReset={handleResetFilters}
          />
        )}
      </AnimatePresence>

      {/* ── AI Insights Highlight Panel ── */}
      {!loading && recommendations.length > 0 && (
        <RecommendationInsights
          recommendations={recommendations}
          onSelectRecommendation={setSelectedRec}
        />
      )}

      {/* ── Error State Card ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle size={24} className="text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-800">{error}</p>
          <Button variant="secondary" size="sm" onClick={generateRecommendations}>
            Retry Generation
          </Button>
        </div>
      )}

      {/* ── Main Recommendations Display ── */}
      {loading ? (
        <RecommendationSkeleton />
      ) : recommendations.length === 0 ? (
        <RecommendationEmptyState onGenerate={generateRecommendations} />
      ) : processedRecommendations.length === 0 ? (
        <RecommendationEmptyState
          isFiltered
          onGenerate={generateRecommendations}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <RecommendationGrid
          recommendations={processedRecommendations}
          onView={setSelectedRec}
          onCookNow={handleCookNow}
          onSave={handleSaveToCookbook}
          onFavoriteToggle={handleFavoriteToggle}
          favorites={favorites}
        />
      )}

      {/* ── Detail Modal ── */}
      <RecommendationModal
        isOpen={Boolean(selectedRec)}
        onClose={() => setSelectedRec(null)}
        recommendation={selectedRec}
        onCookNow={handleCookNow}
        onSaveToCookbook={handleSaveToCookbook}
      />
    </div>
  );
};

export default AIRecommendations;
