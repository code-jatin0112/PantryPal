import React from 'react';
import { AnimatePresence } from 'framer-motion';
import RecommendationCard from './RecommendationCard';

const RecommendationGrid = ({
  recommendations = [],
  onView,
  onCookNow,
  onSave,
  onFavoriteToggle,
  favorites = new Set(),
}) => {
  return (
    <AnimatePresence mode="popLayout">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {recommendations.map((rec, idx) => (
          <RecommendationCard
            key={rec.recipeId || rec.id || idx}
            recommendation={rec}
            index={idx}
            onView={onView}
            onCookNow={onCookNow}
            onSave={onSave}
            onFavoriteToggle={onFavoriteToggle}
            isFavorite={favorites.has(rec.recipeId || rec.id)}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default RecommendationGrid;
