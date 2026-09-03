import React from 'react';
import { AnimatePresence } from 'framer-motion';
import RecipeCard from './RecipeCard';

const RecipeGrid = ({
  recipes = [],
  favorites = new Set(),
  pantryMatches = {},
  onFavoriteToggle,
  onRecipeClick,
}) => {
  return (
    <AnimatePresence mode="popLayout">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {recipes.map((recipe, idx) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            index={idx}
            isFavorite={favorites.has(recipe.id)}
            pantryMatch={pantryMatches[recipe.id]}
            onFavoriteToggle={() => onFavoriteToggle(recipe.id)}
            onClick={() => onRecipeClick(recipe.id)}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default RecipeGrid;
