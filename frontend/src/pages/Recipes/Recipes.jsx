import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Sparkles, BookOpen, Heart, Clock, Flame, RefreshCw } from 'lucide-react';

import RecipeGrid from '../../components/recipes/RecipeGrid';
import RecipeTable from '../../components/recipes/RecipeTable';
import RecipeSearch from '../../components/recipes/RecipeSearch';
import RecipeFilters from '../../components/recipes/RecipeFilters';
import DeleteRecipeDialog from '../../components/recipes/DeleteRecipeDialog';
import EmptyRecipes from '../../components/recipes/EmptyRecipes';
import RecipeSkeleton from '../../components/recipes/RecipeSkeleton';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/ui/Button';

import {
  getRecipes,
  getFavoriteRecipes,
  addFavorite,
  removeFavorite,
  deleteRecipe,
  getRecipePantryAvailability,
} from '../../services/recipeService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { getErrorMessage } from '../../utils/errorHandler';

const Recipes = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { activePantry } = usePantry();

  // State
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [pantryMatches, setPantryMatches] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, debouncedSearch, setSearch] = useDebouncedSearch('');
  const [category, setCategory] = useState('All');
  const [cuisine, setCuisine] = useState('All');
  const [difficulty, setDifficulty] = useState('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load recipes and favorites
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recipesRes, favsRes] = await Promise.allSettled([
        getRecipes(),
        getFavoriteRecipes(),
      ]);

      const recipeList =
        recipesRes.status === 'fulfilled'
          ? recipesRes.value.data.data?.recipes || recipesRes.value.data.data || []
          : [];

      const favList =
        favsRes.status === 'fulfilled'
          ? favsRes.value.data.data?.recipes || favsRes.value.data.data || []
          : [];

      setRecipes(recipeList);
      setFavorites(new Set(favList.map((r) => r.id)));
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to load recipes.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Pantry matching ratios for active pantry
  useEffect(() => {
    if (!activePantry?.id || recipes.length === 0) return;

    const fetchMatches = async () => {
      const results = {};
      await Promise.allSettled(
        recipes.map(async (r) => {
          try {
            const res = await getRecipePantryAvailability(r.id, activePantry.id);
            results[r.id] = res.data.data?.availabilityRatio ?? res.data.data?.matchPercentage ?? null;
          } catch {
            results[r.id] = null;
          }
        })
      );
      setPantryMatches(results);
    };

    fetchMatches();
  }, [recipes, activePantry]);

  // Favorite toggle handler
  const handleFavoriteToggle = async (recipeId) => {
    const isFav = favorites.has(recipeId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });

    try {
      if (isFav) {
        await removeFavorite(recipeId);
        toast('Removed from favorites.', 'info');
      } else {
        await addFavorite(recipeId);
        toast('Added to favorites! ❤️', 'success');
      }
    } catch (err) {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(recipeId);
        else next.delete(recipeId);
        return next;
      });
      toast(getErrorMessage(err) || 'Failed to update favorite.', 'error');
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecipe(deleteTarget.id);
      setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast(`"${deleteTarget.title || deleteTarget.name}" deleted.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to delete recipe.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Stats Calculations (Section 15)
  const stats = useMemo(() => {
    const total = recipes.length;
    const favCount = favorites.size;

    const validCookTimes = recipes.map((r) => (r.prepTime || 0) + (r.cookTime || 0)).filter((t) => t > 0);
    const avgCookTime = validCookTimes.length > 0
      ? Math.round(validCookTimes.reduce((a, b) => a + b, 0) / validCookTimes.length)
      : 25;

    const validCalories = recipes.map((r) => r.nutrition?.calories).filter((c) => c && c > 0);
    const avgCalories = validCalories.length > 0
      ? Math.round(validCalories.reduce((a, b) => a + b, 0) / validCalories.length)
      : 480;

    return { total, favCount, avgCookTime, avgCalories };
  }, [recipes, favorites]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(recipes.map((r) => r.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [recipes]);

  // Cuisines list
  const cuisines = useMemo(() => {
    const set = new Set(recipes.map((r) => r.cuisine || r.cuisineType).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [recipes]);

  // Filtered & Sorted recipes
  const processedRecipes = useMemo(() => {
    return recipes
      .filter((r) => {
        const title = r.title || r.name || '';
        const rCuisine = r.cuisine || r.cuisineType || '';
        const rCategory = r.category || '';
        const q = debouncedSearch.toLowerCase().trim();

        const matchSearch =
          !q ||
          title.toLowerCase().includes(q) ||
          rCuisine.toLowerCase().includes(q) ||
          rCategory.toLowerCase().includes(q);

        const matchCategory = category === 'All' || rCategory === category;
        const matchCuisine = cuisine === 'All' || rCuisine === cuisine;
        const matchDiff = difficulty === 'ALL' || (r.difficulty || 'MEDIUM').toUpperCase() === difficulty;
        const matchFav = !onlyFavorites || favorites.has(r.id);

        return matchSearch && matchCategory && matchCuisine && matchDiff && matchFav;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'match_desc') {
          const ma = pantryMatches[a.id] ?? -1;
          const mb = pantryMatches[b.id] ?? -1;
          return mb - ma;
        }
        if (sortBy === 'name_asc') {
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        }
        if (sortBy === 'name_desc') {
          return (b.title || b.name || '').localeCompare(a.title || a.name || '');
        }
        if (sortBy === 'time_asc') {
          const ta = (a.prepTime || 0) + (a.cookTime || 0);
          const tb = (b.prepTime || 0) + (b.cookTime || 0);
          return ta - tb;
        }
        if (sortBy === 'cal_asc') {
          const ca = a.nutrition?.calories || 9999;
          const cb = b.nutrition?.calories || 9999;
          return ca - cb;
        }
        return 0;
      });
  }, [recipes, debouncedSearch, category, cuisine, difficulty, onlyFavorites, sortBy, favorites, pantryMatches]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setCuisine('All');
    setDifficulty('ALL');
    setOnlyFavorites(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Recipe Cookbook
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-sage)] mt-1 font-medium">
            Explore recipes, calculate pantry stock match, and scale portions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={loadData}
            aria-label="Refresh recipes"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/recipes/new')}
          >
            Create Recipe
          </Button>
        </div>
      </div>

      {/* ── Statistics Overview (Section 15) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          title="Total Recipes"
          value={stats.total}
          description="In your personal cookbook"
          onClick={() => { setOnlyFavorites(false); }}
        />
        <StatCard
          icon={Heart}
          title="Favorites"
          value={stats.favCount}
          description="Bookmarked favorites"
          onClick={() => { setOnlyFavorites(true); }}
        />
        <StatCard
          icon={Clock}
          title="Avg Cook Time"
          value={`${stats.avgCookTime}m`}
          description="Average preparation & cook"
        />
        <StatCard
          icon={Flame}
          title="Avg Calories"
          value={`${stats.avgCalories}`}
          description="Estimated kcal per portion"
        />
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-4">
        <RecipeSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by recipe title, cuisine, or ingredient..."
        />

        <RecipeFilters
          category={category}
          onCategoryChange={setCategory}
          cuisine={cuisine}
          onCuisineChange={setCuisine}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onlyFavorites={onlyFavorites}
          onOnlyFavoritesChange={setOnlyFavorites}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categories={categories}
          cuisines={cuisines}
        />
      </div>

      {/* ── Main Recipe Content ── */}
      {loading ? (
        <RecipeSkeleton view={viewMode} count={8} />
      ) : recipes.length === 0 ? (
        <EmptyRecipes onCreateRecipe={() => navigate('/recipes/new')} />
      ) : processedRecipes.length === 0 ? (
        <EmptyRecipes
          isFiltered
          onCreateRecipe={() => navigate('/recipes/new')}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'table' ? (
        <RecipeTable
          recipes={processedRecipes}
          favorites={favorites}
          pantryMatches={pantryMatches}
          onFavoriteToggle={handleFavoriteToggle}
          onRecipeClick={(id) => navigate(`/recipes/${id}`)}
          onEdit={(id) => navigate(`/recipes/${id}/edit`)}
          onDelete={setDeleteTarget}
        />
      ) : (
        <RecipeGrid
          recipes={processedRecipes}
          favorites={favorites}
          pantryMatches={pantryMatches}
          onFavoriteToggle={handleFavoriteToggle}
          onRecipeClick={(id) => navigate(`/recipes/${id}`)}
        />
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteRecipeDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        recipeTitle={deleteTarget?.title || deleteTarget?.name}
        loading={deleting}
      />
    </div>
  );
};

export default Recipes;
