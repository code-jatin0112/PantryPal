import React, { useState, useEffect, useCallback } from 'react';
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
import {
  BookOpen, Heart, Trash2, Plus, X, Sparkles,
  Clock, Users, ChefHat, Search, Star, Package,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

// ─── Difficulty Badge ──────────────────────────────────────────────────────────
const DiffBadge = ({ level }) => {
  const map = {
    EASY:   'bg-green-100 text-green-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HARD:   'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[level] || 'bg-sage/20 text-sage'}`}>
      {level}
    </span>
  );
};

// ─── Pantry Match Badge ────────────────────────────────────────────────────────
const MatchBadge = ({ match }) => {
  if (match === null) return null;
  const pct = Math.round(match * 100);
  const color = pct >= 80 ? 'text-green-600 bg-green-50 border-green-200'
    : pct >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% match
    </span>
  );
};

// ─── Recipe Detail Modal ───────────────────────────────────────────────────────
const RecipeDetailModal = ({ recipe, pantryId, onClose, onFavoriteToggle, isFav, onSaved }) => {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-sage/20">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {recipe.difficulty && <DiffBadge level={recipe.difficulty} />}
              {recipe.cuisineType && (
                <span className="text-xs bg-olive/20 text-bark px-2 py-0.5 rounded-full">{recipe.cuisineType}</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-bark">{recipe.title || recipe.name}</h2>
            {recipe.description && <p className="text-sage text-sm mt-1">{recipe.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {recipe.id !== 'ai-preview' && (
              <button onClick={() => onFavoriteToggle(recipe.id, isFav)}
                className={`p-2 rounded-xl border transition-all ${isFav ? 'bg-red-50 border-red-200 text-red-500' : 'border-sage/30 text-sage hover:border-red-300 hover:text-red-400'}`}>
                <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl border border-sage/30 text-sage hover:text-bark transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm">
            {recipe.prepTime && (
              <div className="flex items-center gap-1.5 text-sage">
                <Clock size={15} /><span>Prep: <strong className="text-bark">{recipe.prepTime}m</strong></span>
              </div>
            )}
            {recipe.cookTime && (
              <div className="flex items-center gap-1.5 text-sage">
                <ChefHat size={15} /><span>Cook: <strong className="text-bark">{recipe.cookTime}m</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sage">
              <Users size={15} />
              <span>Servings:</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setServings(s => Math.max(1, s - 1))}
                  className="w-6 h-6 rounded-full bg-sage/20 text-bark font-bold flex items-center justify-center hover:bg-sage/40 transition-colors text-xs">−</button>
                <span className="font-bold text-bark w-5 text-center">{servings}</span>
                <button onClick={() => setServings(s => s + 1)}
                  className="w-6 h-6 rounded-full bg-sage/20 text-bark font-bold flex items-center justify-center hover:bg-sage/40 transition-colors text-xs">+</button>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="font-bold text-bark mb-3 flex items-center gap-2">
              <Package size={16} className="text-sage" /> Ingredients
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sage text-sm"><Loader2 size={16} className="animate-spin" /> Loading...</div>
            ) : ingredients.length === 0 ? (
              <p className="text-sage text-sm">No ingredients listed.</p>
            ) : (
              <ul className="space-y-2">
                {ingredients.map((ing, i) => {
                  const scaledQty = recipe.servings
                    ? ((ing.quantity || 0) * servings / recipe.servings).toFixed(1).replace(/\.0$/, '')
                    : ing.quantity;
                  return (
                    <li key={i} className="flex items-center justify-between py-1.5 border-b border-sage/10 last:border-0 text-sm">
                      <span className="text-bark">{ing.name}</span>
                      <span className="text-sage font-medium">{formatIngredientQuantity(scaledQty, ing.unit)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Instructions */}
          {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
            <div>
              <h3 className="font-bold text-bark mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-sage" /> Instructions
              </h3>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-bark/90">
                    <span className="w-6 h-6 rounded-full bg-sage text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{typeof step === 'string' ? step : step.description}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-sage to-bark rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-bark">Generate Recipe with AI</h2>
            <p className="text-xs text-sage">Grounded in your active pantry stock</p>
          </div>
        </div>

        {pantryItemsCount === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Your pantry has 0 ingredients.</p>
              <p className="mt-0.5">PantryPal's recipe generator uses your real pantry stock to design realistic recipes. Add ingredients in the <strong>My Pantry</strong> tab, or use the <strong>AI Assistant</strong> tab to brainstorm freely!</p>
            </div>
          </div>
        )}

        <p className="text-sage text-sm mb-3">Describe any cravings, cuisine preferences, or diet goals:</p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. I want to make a burger with what I have…"
          className="w-full px-4 py-3 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-sage/30 text-sage font-medium text-sm hover:bg-sage/10 transition-colors">
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={!prompt.trim() || loading || pantryItemsCount === 0}
            className="flex-1 py-2.5 rounded-xl bg-sage text-white font-medium text-sm hover:bg-bark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Recipe Card ───────────────────────────────────────────────────────────────
const RecipeCard = ({ recipe, isFav, pantryMatch, onOpen, onFavoriteToggle, onDelete }) => (
  <div
    onClick={() => onOpen(recipe)}
    className="group bg-white rounded-2xl border border-sage/20 p-5 hover:shadow-lg hover:border-sage/40 transition-all duration-200 cursor-pointer flex flex-col gap-3"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {recipe.difficulty && <DiffBadge level={recipe.difficulty} />}
          <MatchBadge match={pantryMatch} />
        </div>
        <h3 className="font-bold text-bark leading-snug line-clamp-2">{recipe.title || recipe.name}</h3>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onFavoriteToggle(recipe.id, isFav)}
          className={`p-1.5 rounded-lg transition-all ${isFav ? 'text-red-500' : 'text-sage hover:text-red-400'}`}>
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => onDelete(recipe)}
          className="p-1.5 rounded-lg text-sage hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={15} />
        </button>
      </div>
    </div>

    {recipe.description && (
      <p className="text-sage text-xs leading-relaxed line-clamp-2">{recipe.description}</p>
    )}

    <div className="flex items-center gap-3 text-xs text-sage mt-auto pt-1 border-t border-sage/10">
      {recipe.prepTime && <span className="flex items-center gap-1"><Clock size={12} />{recipe.prepTime}m prep</span>}
      {recipe.cookTime && <span className="flex items-center gap-1"><ChefHat size={12} />{recipe.cookTime}m cook</span>}
      {recipe.servings && <span className="flex items-center gap-1"><Users size={12} />{recipe.servings} servings</span>}
    </div>
  </div>
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
  const [filter, setFilter] = useState('all'); // all | favorites | ai
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

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

  const handleDelete = async (recipe) => {
    if (!window.confirm(`Delete "${recipe.name}"? This cannot be undone.`)) return;
    try {
      await deleteRecipe(recipe.id);
      setRecipes(prev => prev.filter(r => r.id !== recipe.id));
      toast(`"${recipe.name}" deleted.`, 'info');
    } catch {
      toast('Failed to delete recipe.', 'error');
    }
  };

  const handleAIGenerated = (recipe) => {
    setAiPreview(recipe);
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bark">Recipe Browser</h1>
          <p className="text-sage text-sm mt-1">{recipes.length} recipes · sorted by pantry match</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sage to-bark text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm shadow-md">
            <Sparkles size={16} /> Generate with AI
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/30 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['favorites', '❤️ Favorites']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filter === val ? 'bg-sage text-white' : 'border border-sage/30 text-sage hover:border-bark hover:text-bark'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pantry match legend */}
      {activePantry && Object.keys(pantryMatches).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-sage">
          <span className="font-medium">Pantry match:</span>
          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> ≥80% can cook now</span>
          <span className="flex items-center gap-1"><AlertCircle size={12} className="text-amber-500" /> 50–79% missing some</span>
          <span className="flex items-center gap-1"><AlertCircle size={12} className="text-red-400" /> &lt;50% missing most</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-sage/10 p-5 animate-pulse h-44" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-olive mb-4" />
          <h2 className="text-xl font-bold text-bark mb-2">
            {search ? `No recipes matching "${search}"` : filter === 'favorites' ? 'No favorite recipes yet' : 'No recipes yet'}
          </h2>
          <p className="text-sage text-sm mb-6">Use the AI generator to create your first recipe!</p>
          <button onClick={() => setShowAIModal(true)}
            className="px-6 py-3 bg-sage text-white rounded-xl hover:bg-bark transition-colors font-medium">
            Generate with AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFav={favorites.has(recipe.id)}
              pantryMatch={pantryMatches[recipe.id] ?? null}
              onOpen={setSelectedRecipe}
              onFavoriteToggle={handleFavoriteToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          pantryId={activePantry?.id}
          onClose={() => setSelectedRecipe(null)}
          isFav={favorites.has(selectedRecipe.id)}
          onFavoriteToggle={handleFavoriteToggle}
          onSaved={loadRecipes}
        />
      )}
      {showAIModal && (
        <AIGenerateModal
          pantry={activePantry}
          pantryItemsCount={items.length}
          onClose={() => setShowAIModal(false)}
          onGenerated={handleAIGenerated}
        />
      )}
    </div>
  );
};

export default Recipes;
