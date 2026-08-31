import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Bookmark, Clock, Users, Flame, ChefHat, Sparkles } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import RecipeCard from "../../components/ui/RecipeCard";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { useDebounce } from "../../hooks/useDebounce";
import recipeService from "../../services/recipeService";

export const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'saved'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Detail Modal & Headcount Scaling State
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [scaleHeadcount, setScaleHeadcount] = useState(2);
  const [scaledIngredients, setScaledIngredients] = useState([]);

  const fetchRecipesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "saved") {
        const res = await recipeService.getSavedRecipes({ page, limit: 12 });
        const items = res.data?.savedRecipes?.map((s) => s.recipe) || [];
        setSavedRecipes(items);
        setTotalPages(res.data?.totalPages || 1);
      } else {
        const [recipesRes, savedRes] = await Promise.all([
          recipeService.getRecipes({
            page,
            limit: 12,
            search: debouncedSearch,
            cuisine: selectedCuisine,
            difficulty: selectedDifficulty,
          }),
          recipeService.getSavedRecipes(),
        ]);

        setRecipes(recipesRes.data?.recipes || []);
        setTotalPages(recipesRes.data?.totalPages || 1);

        const savedIds = new Set(
          (savedRes.data?.savedRecipes || []).map((s) => s.recipeId)
        );
        setSavedRecipeIds(savedIds);
      }
    } catch (err) {
      setError(err.message || "Failed to load recipes");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, debouncedSearch, selectedCuisine, selectedDifficulty]);

  useEffect(() => {
    fetchRecipesData();
  }, [fetchRecipesData]);

  const handleToggleSave = async (recipe) => {
    const isCurrentlySaved = savedRecipeIds.has(recipe.id);
    try {
      if (isCurrentlySaved) {
        await recipeService.unsaveRecipe(recipe.id);
        setSavedRecipeIds((prev) => {
          const next = new Set(prev);
          next.delete(recipe.id);
          return next;
        });
      } else {
        await recipeService.saveRecipe(recipe.id);
        setSavedRecipeIds((prev) => new Set(prev).add(recipe.id));
      }
    } catch (err) {
      alert(err.message || "Could not update bookmark");
    }
  };

  const handleOpenRecipeDetail = async (recipe) => {
    setSelectedRecipe(recipe);
    setScaleHeadcount(recipe.servings || 2);
    setScaledIngredients(recipe.ingredients || []);
  };

  const handleScaleChange = async (newCount) => {
    if (newCount < 1 || !selectedRecipe) return;
    setScaleHeadcount(newCount);
    try {
      const scaledRes = await recipeService.scaleRecipe(
        selectedRecipe.id,
        newCount
      );
      if (scaledRes.data?.scaledRecipe?.ingredients) {
        setScaledIngredients(scaledRes.data.scaledRecipe.ingredients);
      }
    } catch (err) {
      // Fallback simple scaling formula
      const baseServings = selectedRecipe.servings || 2;
      const ratio = newCount / baseServings;
      setScaledIngredients(
        selectedRecipe.ingredients.map((ing) => ({
          ...ing,
          quantity: Math.round(ing.quantity * ratio * 10) / 10,
        }))
      );
    }
  };

  const currentList = activeTab === "saved" ? savedRecipes : recipes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#272A1F] tracking-tight">
            Recipe Catalog
          </h2>
          <p className="text-sm text-[#5E5947]">
            Discover culinary inspiration tailored to your ingredients and headcount.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-white border border-[#D8C6A5]/50 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#8A9070] text-white shadow-xs"
                : "text-[#5E5947] hover:text-[#272A1F]"
            }`}
          >
            All Recipes
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("saved");
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "saved"
                ? "bg-[#8A9070] text-white shadow-xs"
                : "text-[#5E5947] hover:text-[#272A1F]"
            }`}
          >
            My Cookbook ({savedRecipeIds.size})
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      {activeTab === "all" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search recipes, ingredients, cuisines..."
            />
          </div>

          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-white text-sm text-[#272A1F] rounded-xl border border-[#D8C6A5]/60 px-4 py-2.5 shadow-sm focus:outline-none focus:border-[#8A9070] cursor-pointer capitalize"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy (&lt; 20 min)</option>
              <option value="medium">Medium</option>
              <option value="hard">Chef Level</option>
            </select>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {isLoading ? (
        <Loader message="Loading recipes..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRecipesData} />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={
            activeTab === "saved"
              ? "No saved recipes yet"
              : "No recipes found"
          }
          description={
            activeTab === "saved"
              ? "Bookmark your favorite recipes to access them quickly here."
              : "Try adjusting your search terms or filters."
          }
          actionLabel={activeTab === "saved" ? "Explore Recipes" : "Clear Search"}
          onAction={() => {
            if (activeTab === "saved") setActiveTab("all");
            else setSearchQuery("");
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentList.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isSaved={savedRecipeIds.has(recipe.id)}
                onSave={handleToggleSave}
                onSelect={handleOpenRecipeDetail}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <Modal
          isOpen={Boolean(selectedRecipe)}
          onClose={() => setSelectedRecipe(null)}
          title={selectedRecipe.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary" size="md">
                {selectedRecipe.cuisine || "General"}
              </Badge>
              <Badge variant="outline" size="md">
                {selectedRecipe.difficulty || "medium"}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-[#5E5947] font-medium ml-auto">
                <Clock className="w-4 h-4 text-[#8A9070]" />
                <span>
                  {(selectedRecipe.prepTime || 0) + (selectedRecipe.cookTime || 0)}{" "}
                  min total
                </span>
              </div>
            </div>

            {selectedRecipe.description && (
              <p className="text-sm text-[#5E5947] leading-relaxed">
                {selectedRecipe.description}
              </p>
            )}

            {/* Dynamic Headcount Scaling Controls */}
            <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#D8C6A5]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8A9070]" />
                <div>
                  <span className="text-sm font-bold text-[#272A1F] block">
                    Dynamic Headcount Scaling
                  </span>
                  <span className="text-xs text-[#5E5947]">
                    Calculates exact ingredient amounts
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScaleChange(scaleHeadcount - 1)}
                  disabled={scaleHeadcount <= 1}
                  className="w-8 h-8 rounded-lg bg-white border border-[#D8C6A5]/50 flex items-center justify-center font-bold text-[#272A1F] disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-base text-[#272A1F]">
                  {scaleHeadcount}
                </span>
                <button
                  type="button"
                  onClick={() => handleScaleChange(scaleHeadcount + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#D8C6A5]/50 flex items-center justify-center font-bold text-[#272A1F] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Scaled Ingredients */}
            <div>
              <h4 className="text-sm font-bold text-[#272A1F] uppercase tracking-wider mb-2.5">
                Ingredients ({scaleHeadcount} servings)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scaledIngredients.map((ing, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-white border border-[#D8C6A5]/30 text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold text-[#272A1F]">
                      {ing.name}
                    </span>
                    <span className="text-[#8A9070] font-bold">
                      {ing.quantity} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instruction Steps */}
            {selectedRecipe.instructions && (
              <div>
                <h4 className="text-sm font-bold text-[#272A1F] uppercase tracking-wider mb-2.5">
                  Preparation Steps
                </h4>
                <ol className="space-y-2">
                  {(Array.isArray(selectedRecipe.instructions)
                    ? selectedRecipe.instructions
                    : JSON.parse(selectedRecipe.instructions || "[]")
                  ).map((step, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF8F3] border border-[#D8C6A5]/30 text-xs text-[#272A1F] flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#8A9070] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Recipes;

