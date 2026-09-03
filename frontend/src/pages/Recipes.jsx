import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { usePantry } from '../hooks/usePantry';
import {
  getRecipes, deleteRecipe, getFavoriteRecipes,
  addFavorite, removeFavorite, getRecipeIngredients,
  getRecipePantryAvailability, createRecipe
} from '../services/recipeService';
import { generateAIRecipe } from '../services/aiService';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { formatIngredientQuantity } from '../utils/hoistingDemo';
import { getErrorMessage } from '../utils/errorHandler';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import {
  BookOpen, Heart, Trash2, Sparkles,
  Clock, Users, ChefHat, Search, Package,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

// ─── Difficulty Badge ──────────────────────────────────────────────────────────
const DiffBadge = ({ level }) => {
  const map = {
    EASY:   'badge-success',
    MEDIUM: 'badge-warning',
    HARD:   'badge-danger',
  };
  return <span className={`badge ${map[level] || 'badge-neutral'}`}>{level}</span>;
};

// ─── Pantry Match Badge ────────────────────────────────────────────────────────
const MatchBadge = ({ match }) => {
  if (match === null) return null;
  const pct = Math.round(match * 100);
  const cls = pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger';
  return <span className={`badge ${cls}`}>{pct}% match</span>;
};

// ─── Recipe Detail Modal ───────────────────────────────────────────────────────
const RecipeDetailModal = ({ isOpen, recipe, pantryId, onClose, onFavoriteToggle, isFav, onSaved }) => {
  if (!recipe) return null;
  const toast = useToast();
  const [ingredients, setIngredients] = useState(recipe.ingredients || []);
  const [loading, setLoading] = useState(!recipe.ingredients);
  const [servings, setServings] = useState(recipe.servings || 2);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      setIngredients(recipe.ingredients);
      setLoading(false);
      return;
    }
    if (recipe.id && recipe.id !== 'ai-preview') {
      getRecipeIngredients(recipe.id)
        .then(r => setIngredients(r.data.data.ingredients || []))
        .catch(() => setIngredients([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [recipe]);

  const handleSaveRecipe = async () => {
    setSaving(true);
    try {
      const instructionsText = Array.isArray(recipe.instructions)
        ? recipe.instructions.map((s, i) => `${i + 1}. ${typeof s === 'string' ? s : s.description}`).join('\n')
        : recipe.instructions || 'Follow standard cooking directions.';

      await createRecipe({
        title: recipe.title || recipe.name || 'AI Generated Dish',
        description: recipe.description || undefined,
        instructions: instructionsText,
        prepTime: recipe.prepTime ? parseInt(recipe.prepTime) : undefined,
        cookTime: recipe.cookTime ? parseInt(recipe.cookTime) : undefined,
        servings: servings ? parseInt(servings) : undefined,
      });
      toast('Recipe saved to My Recipes! 🍳', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      toast('Failed to save recipe to database.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg"
      title={recipe.title || recipe.name}
      footer={recipe.id === 'ai-preview' && (
        <Button variant="primary" fullWidth loading={saving} onClick={handleSaveRecipe}>
          Save Recipe to My Cookbook
        </Button>
      )}
    >
      {/* Title badges + favorite */}
      <div className="flex items-center gap-2 flex-wrap mb-4 -mt-1">
        {recipe.difficulty && <DiffBadge level={recipe.difficulty} />}
        {recipe.cuisineType && <span className="badge badge-neutral">{recipe.cuisineType}</span>}
        {recipe.id !== 'ai-preview' && (
          <button onClick={() => onFavoriteToggle(recipe.id, isFav)}
            className={`ml-auto p-1.5 rounded-xl border transition-all ${
              isFav ? 'bg-red-50 border-red-200 text-red-500' : 'border-[rgba(138,144,112,0.25)] text-[var(--color-sage)] hover:text-red-400'
            }`}>
            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      {recipe.description && <p className="text-sm text-[var(--color-sage)] mb-4 leading-relaxed">{recipe.description}</p>}

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-sm mb-5 pb-4 border-b border-[rgba(138,144,112,0.12)]">
        {recipe.prepTime && (
          <div className="flex items-center gap-1.5 text-[var(--color-sage)]">
            <Clock size={14}/><span>Prep: <strong className="text-[var(--color-dark)]">{recipe.prepTime}m</strong></span>
          </div>
        )}
        {recipe.cookTime && (
          <div className="flex items-center gap-1.5 text-[var(--color-sage)]">
            <ChefHat size={14}/><span>Cook: <strong className="text-[var(--color-dark)]">{recipe.cookTime}m</strong></span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[var(--color-sage)]">
          <Users size={14}/>
          <span>Servings:</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setServings(s => Math.max(1, s - 1))}
              className="w-6 h-6 rounded-full bg-[rgba(138,144,112,0.15)] text-[var(--color-dark)] font-bold flex items-center justify-center hover:bg-[rgba(138,144,112,0.3)] text-xs">−</button>
            <span className="font-bold text-[var(--color-dark)] w-5 text-center">{servings}</span>
            <button onClick={() => setServings(s => s + 1)}
              className="w-6 h-6 rounded-full bg-[rgba(138,144,112,0.15)] text-[var(--color-dark)] font-bold flex items-center justify-center hover:bg-[rgba(138,144,112,0.3)] text-xs">+</button>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-5">
        <h3 className="font-bold text-[var(--color-dark)] mb-3 flex items-center gap-2 text-sm">
          <Package size={15} className="text-[var(--color-sage)]" /> Ingredients
        </h3>
        {loading ? (
          <div className="flex items-center gap-2 text-[var(--color-sage)] text-sm"><Loader2 size={15} className="animate-spin"/>Loading…</div>
        ) : ingredients.length === 0 ? (
          <p className="text-sm text-[var(--color-sage)]">No ingredients listed.</p>
        ) : (
          <ul className="space-y-1.5">
            {ingredients.map((ing, i) => {
              const scaledQty = recipe.servings
                ? ((ing.quantity || 0) * servings / recipe.servings).toFixed(1).replace(/\.0$/, '')
                : ing.quantity;
              return (
                <li key={i} className="flex items-center justify-between py-1.5 border-b border-[rgba(138,144,112,0.10)] last:border-0 text-sm">
                  <span className="text-[var(--color-dark)]">{ing.name}</span>
                  <span className="text-[var(--color-sage)] font-semibold">{formatIngredientQuantity(scaledQty, ing.unit)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Instructions */}
      {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
        <div>
          <h3 className="font-bold text-[var(--color-dark)] mb-3 flex items-center gap-2 text-sm">
            <BookOpen size={15} className="text-[var(--color-sage)]" /> Instructions
          </h3>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-[var(--color-dark)] opacity-85">
                <span className="w-6 h-6 rounded-full bg-[var(--color-sage)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <span className="leading-relaxed">{typeof step === 'string' ? step : step.description}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  );
};

// ─── AI Generate Modal ─────────────────────────────────────────────────────────
const AIGenerateModal = ({ pantry, pantryItemsCount, onClose, onGenerated }) => {
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!pantry?.id) {
      toast('Please create a pantry first in the My Pantry tab!', 'warning');
      return;
    }
    if (pantryItemsCount === 0) {
      toast('Your pantry has 0 ingredients! Please add ingredients to your pantry first so the AI can ground the recipe.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await generateAIRecipe({ 
        pantryId: pantry.id, 
        preferences: prompt.trim() 
      });
      const recipeData = res.data.data?.recipe || res.data.data;
      onGenerated(recipeData);
      toast('AI recipe generated based on your pantry stock!', 'success');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || 'Failed to generate recipe. Try again.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!onClose} onClose={onClose} title="Generate Recipe with AI">
      <div className="flex items-center gap-3 mb-4 -mt-1">
        <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] rounded-xl flex items-center justify-center">
          <Sparkles size={17} className="text-white" />
        </div>
        <p className="text-xs text-[var(--color-sage)]">Grounded in your active pantry stock ({pantryItemsCount} ingredients)</p>
      </div>

      {pantryItemsCount === 0 && (
        <div className="bg-[var(--color-warning-bg)] border border-[rgba(217,164,65,0.3)] rounded-xl p-3 mb-4 text-xs text-[var(--color-warning)] flex items-start gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Your pantry has 0 ingredients.</p>
            <p className="mt-0.5">Add ingredients in <strong>My Pantry</strong> first, or use the <strong>AI Assistant</strong> to brainstorm freely!</p>
          </div>
        </div>
      )}

      <p className="text-sm text-[var(--color-sage)] mb-3">Describe any cravings, cuisine preferences, or diet goals:</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="e.g. I want a quick pasta with what I have…"
        className="input py-3 px-4 resize-none mb-4"
      />
      <Button
        variant="primary" fullWidth
        loading={loading}
        disabled={!prompt.trim() || pantryItemsCount === 0}
        icon={Sparkles}
        onClick={handleGenerate}
      >
        Generate Recipe
      </Button>
    </Modal>
  );
};

// ─── Recipe Card ───────────────────────────────────────────────────────────────
const RecipeCard = ({ recipe, isFav, pantryMatch, onOpen, onFavoriteToggle, onDelete, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: index * 0.04 }}
    onClick={() => onOpen(recipe)}
    className="group card card-hover p-5 cursor-pointer flex flex-col gap-3"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {recipe.difficulty && <DiffBadge level={recipe.difficulty} />}
          <MatchBadge match={pantryMatch} />
        </div>
        <h3 className="font-bold text-[var(--color-dark)] leading-snug line-clamp-2">{recipe.title || recipe.name}</h3>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onFavoriteToggle(recipe.id, isFav)}
          className={`p-1.5 rounded-lg transition-all ${isFav ? 'text-red-500' : 'text-[var(--color-sage)] hover:text-red-400'}`}>
          <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => onDelete(recipe)}
          className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={14} />
        </button>
      </div>
    </div>

    {recipe.description && (
      <p className="text-[var(--color-sage)] text-xs leading-relaxed line-clamp-2">{recipe.description}</p>
    )}

    <div className="flex items-center gap-3 text-xs text-[var(--color-sage)] mt-auto pt-2 border-t border-[rgba(138,144,112,0.10)]">
      {recipe.prepTime && <span className="flex items-center gap-1"><Clock size={12} />{recipe.prepTime}m prep</span>}
      {recipe.cookTime && <span className="flex items-center gap-1"><ChefHat size={12} />{recipe.cookTime}m cook</span>}
      {recipe.servings && <span className="flex items-center gap-1"><Users size={12} />{recipe.servings} servings</span>}
    </div>
  </motion.div>
);

// ─── Main Recipes Page ─────────────────────────────────────────────────────────
const Recipes = () => {
  const toast = useToast();
  const { activePantry, items = [] } = usePantry();

  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [pantryMatches, setPantryMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, debouncedSearch, setSearch] = useDebouncedSearch('');
  const [filter, setFilter] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const [recipeRes, favRes] = await Promise.all([
        getRecipes(),
        getFavoriteRecipes().catch(() => ({ data: { data: { recipes: [] } } })),
      ]);
      const list = recipeRes.data.data.recipes || [];
      const favIds = new Set((favRes.data.data.recipes || []).map(r => r.id));
      setRecipes(list);
      setFavorites(favIds);
    } catch {
      toast('Failed to load recipes.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  // Pantry match — run for each recipe once pantry is known
  useEffect(() => {
    if (!activePantry?.id || recipes.length === 0) return;
    const fetchMatches = async () => {
      const results = {};
      await Promise.allSettled(
        recipes.map(async r => {
          try {
            const res = await getRecipePantryAvailability(r.id, activePantry.id);
            results[r.id] = res.data.data?.availabilityRatio ?? null;
          } catch { results[r.id] = null; }
        })
      );
      setPantryMatches(results);
    };
    fetchMatches();
  }, [recipes, activePantry]);

  const handleFavoriteToggle = async (recipeId, isFav) => {
    try {
      if (isFav) {
        await removeFavorite(recipeId);
        setFavorites(prev => { const n = new Set(prev); n.delete(recipeId); return n; });
        toast('Removed from favorites.', 'info');
      } else {
        await addFavorite(recipeId);
        setFavorites(prev => new Set([...prev, recipeId]));
        toast('Added to favorites! ❤️', 'success');
      }
    } catch {
      toast('Failed to update favorite.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecipe(deleteTarget.id);
      setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast(`"${deleteTarget.title || deleteTarget.name}" deleted.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAIGenerated = (recipe) => {
    setSelectedRecipe({ ...recipe, id: 'ai-preview' });
  };

  const filtered = recipes.filter(r => {
    const title = r.title || r.name || '';
    const matchSearch = title.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'favorites' && favorites.has(r.id));
    return matchSearch && matchFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ma = pantryMatches[a.id] ?? -1;
    const mb = pantryMatches[b.id] ?? -1;
    return mb - ma;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 gap-4 flex-wrap"
      >
        <div>
          <h1 className="page-title">Recipe Browser</h1>
          <p className="page-subtitle">{recipes.length} recipes · sorted by pantry match</p>
        </div>
        <Button
          variant="primary"
          icon={Sparkles}
          onClick={() => setShowAIModal(true)}
          className="bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-bark)] border-0"
        >
          Generate with AI
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…" className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['favorites', '❤️ Favorites']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === val ? 'bg-[var(--color-sage)] text-white shadow-sm' : 'border border-[rgba(138,144,112,0.25)] text-[var(--color-sage)] hover:border-[var(--color-bark)] hover:text-[var(--color-bark)]'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pantry match legend */}
      {activePantry && Object.keys(pantryMatches).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-[var(--color-sage)]">
          <span className="font-semibold">Pantry match:</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-[var(--color-success)]" /> ≥80% can cook</span>
          <span className="flex items-center gap-1"><AlertCircle size={11} className="text-[var(--color-warning)]" /> 50–79% partial</span>
          <span className="flex items-center gap-1"><AlertCircle size={11} className="text-[var(--color-danger)]" /> &lt;50% missing most</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title={search ? `No results for "${search}"` : filter === 'favorites' ? 'No favorites yet' : 'No recipes yet'}
            description="Generate a recipe with AI from your pantry stock!"
            action={{ label: 'Generate with AI', icon: Sparkles, onClick: () => setShowAIModal(true) }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((recipe, i) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              index={i}
              isFav={favorites.has(recipe.id)}
              pantryMatch={pantryMatches[recipe.id] ?? null}
              onOpen={setSelectedRecipe}
              onFavoriteToggle={handleFavoriteToggle}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <RecipeDetailModal
        isOpen={!!selectedRecipe}
        recipe={selectedRecipe}
        pantryId={activePantry?.id}
        onClose={() => setSelectedRecipe(null)}
        isFav={selectedRecipe ? favorites.has(selectedRecipe.id) : false}
        onFavoriteToggle={handleFavoriteToggle}
        onSaved={loadRecipes}
      />

      {/* AI Generate Modal */}
      {showAIModal && (
        <AIGenerateModal
          pantry={activePantry}
          pantryItemsCount={items.length}
          onClose={() => setShowAIModal(false)}
          onGenerated={handleAIGenerated}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete recipe?"
        description={`"${deleteTarget?.title || deleteTarget?.name}" will be permanently deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Recipes;
