import React, { memo } from "react";
import { Clock, Users, Bookmark, Heart, Flame } from "lucide-react";
import Badge from "./Badge";

export const RecipeCard = memo(
  ({
    recipe,
    onSelect,
    onSave,
    isSaved = false,
    className = "",
  }) => {
    return (
      <div
        className={`group bg-white rounded-2xl border border-[#D8C6A5]/40 shadow-sm hover:shadow-md hover:border-[#8A9070]/50 transition-all duration-200 overflow-hidden flex flex-col justify-between ${className}`}
      >
        <div className="p-5">
          {/* Header Badges & Actions */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge variant="default" size="sm">
              {recipe.cuisine || "General"}
            </Badge>

            {onSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(recipe);
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isSaved
                    ? "bg-[#8A9070] text-white border-[#8A9070]"
                    : "bg-[#FAF8F3] text-[#5E5947] border-[#D8C6A5]/50 hover:text-[#8A9070]"
                }`}
                title={isSaved ? "Saved" : "Save Recipe"}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Title & Description */}
          <h4
            onClick={() => onSelect && onSelect(recipe)}
            className="text-lg font-bold text-[#272A1F] group-hover:text-[#8A9070] transition-colors cursor-pointer line-clamp-1"
          >
            {recipe.title}
          </h4>

          {recipe.description && (
            <p className="text-xs text-[#5E5947] mt-1.5 line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="px-5 py-3 bg-[#FAF8F3]/60 border-t border-[#D8C6A5]/30 flex items-center justify-between text-xs text-[#5E5947] font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#8A9070]" />
            <span>{(recipe.prepTime || 0) + (recipe.cookTime || 0)} min</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#8A9070]" />
            <span>{recipe.servings || 2} servings</span>
          </div>

          {recipe.nutrition?.calories ? (
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>{recipe.nutrition.calories} kcal</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

RecipeCard.displayName = "RecipeCard";

export default RecipeCard;

