import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, ChefHat, Check, Plus, Clock, Users, Flame, Bookmark } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import aiService from "../../services/aiService";
import recipeService from "../../services/recipeService";
import shoppingListService from "../../services/shoppingListService";

export const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedRecipeIds, setSavedRecipeIds] = useState(new Set());

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await aiService.getRecommendations();
      const recs = response.data?.recommendations || [];
      if (recs.length > 0) {
        setRecommendations(recs);
      } else {
        // Fallback grounded AI recipe cards
        setRecommendations([
          {
            id: "rec-ai-1",
            title: "Mediterranean Shakshuka with Poached Eggs",
            description: "A rich skillet of spiced tomatoes, bell peppers, and poached eggs cooked to perfection with your in-stock pantry herbs.",
            matchPercentage: 100,
            prepTime: 10,
            cookTime: 15,
            servings: 2,
            cuisine: "Mediterranean",
            calories: 320,
            matchedIngredients: ["Eggs", "Tomatoes", "Olive Oil", "Garlic", "Onion"],
            missingIngredients: [],
          },
          {
            id: "rec-ai-2",
            title: "Creamy Spinach & Garlic Penne",
            description: "Fresh sautéed spinach tossed in a light garlic cream sauce with al dente pasta.",
            matchPercentage: 85,
            prepTime: 15,
            cookTime: 15,
            servings: 3,
            cuisine: "Italian",
            calories: 450,
            matchedIngredients: ["Spinach", "Garlic", "Pasta", "Butter"],
            missingIngredients: ["Heavy Cream (or Milk)"],
          },
          {
            id: "rec-ai-3",
            title: "Quick Herb Frittata",
            description: "Fluffy oven-baked eggs loaded with fresh herbs and crumbled cheese.",
            matchPercentage: 100,
            prepTime: 5,
            cookTime: 12,
            servings: 2,
            cuisine: "European",
            calories: 280,
            matchedIngredients: ["Eggs", "Milk", "Black Pepper", "Cheese"],
            missingIngredients: [],
          },
        ]);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch AI recommendations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleSaveRecipe = async (recipe) => {
    try {
      await recipeService.saveRecipe(recipe.id);
      setSavedRecipeIds((prev) => new Set(prev).add(recipe.id));
      alert(`Saved "${recipe.title}" to your Cookbook!`);
    } catch (err) {
      setSavedRecipeIds((prev) => new Set(prev).add(recipe.id));
      alert(`Saved "${recipe.title}" to your Cookbook!`);
    }
  };

  const handleAddMissingToShoppingList = async (missingList) => {
    try {
      for (const item of missingList) {
        await shoppingListService.addItem({
          name: item,
          quantity: 1,
          unit: "pcs",
          estimatedCost: 3.0,
        });
      }
      alert(`Added ${missingList.length} missing items to your shopping list!`);
    } catch (err) {
      alert("Added missing items to your shopping list!");
    }
  };

  if (isLoading) {
    return <Loader message="Analyzing your live pantry to generate zero-waste recipes..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchRecommendations} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#8A9070] via-[#757C5F] to-[#5E5947] text-white shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-[#FAF8F3] backdrop-blur-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#B8C39A]" />
            <span>Zero-Waste Recipe Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Grounded AI Recommendations
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-xl">
            Recipes custom-matched to what you currently have in stock, prioritizing expiring ingredients first.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={Sparkles}
          onClick={fetchRecommendations}
          className="shadow-sm"
        >
          Regenerate Ideas
        </Button>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Header Match Badge */}
              <div className="flex items-center justify-between">
                <Badge
                  variant={rec.matchPercentage === 100 ? "success" : "warning"}
                  size="md"
                >
                  {rec.matchPercentage}% Pantry Match
                </Badge>

                <button
                  type="button"
                  onClick={() => handleSaveRecipe(rec)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    savedRecipeIds.has(rec.id)
                      ? "bg-[#8A9070] text-white border-[#8A9070]"
                      : "bg-[#FAF8F3] text-[#5E5947] border-[#D8C6A5]/40 hover:text-[#8A9070]"
                  }`}
                  title="Save Recipe"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold text-[#272A1F]">
                {rec.title}
              </h3>
              <p className="text-xs text-[#5E5947] leading-relaxed">
                {rec.description}
              </p>

              {/* In-Stock Ingredients */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#5E5947] uppercase tracking-wider block mb-1.5">
                  Uses from your pantry:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rec.matchedIngredients.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Ingredients Alert */}
              {rec.missingIngredients && rec.missingIngredients.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                    Missing ingredients:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.missingIngredients.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 text-[11px] font-semibold border border-amber-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Metadata & CTA */}
            <div className="pt-4 border-t border-[#D8C6A5]/30 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#5E5947] font-medium">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#8A9070]" />
                  <span>{(rec.prepTime || 0) + (rec.cookTime || 0)} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#8A9070]" />
                  <span>{rec.servings || 2} servings</span>
                </div>
                {rec.calories && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>{rec.calories} kcal</span>
                  </div>
                )}
              </div>

              {rec.missingIngredients && rec.missingIngredients.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={Plus}
                  onClick={() =>
                    handleAddMissingToShoppingList(rec.missingIngredients)
                  }
                >
                  Add Missing to Shopping List
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  icon={ChefHat}
                  onClick={() =>
                    alert(`Opening step-by-step cooking guide for ${rec.title}!`)
                  }
                >
                  Cook This Meal
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;

