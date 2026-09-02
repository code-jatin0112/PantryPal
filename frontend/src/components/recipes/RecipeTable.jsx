import React from 'react';
import { Clock, Users, Flame, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import Badge from '../ui/Badge';

const RecipeTable = ({
  recipes = [],
  favorites = new Set(),
  pantryMatches = {},
  onFavoriteToggle,
  onRecipeClick,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.15)] text-[11px] font-bold text-[var(--color-sage)] uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-5">Recipe</th>
              <th scope="col" className="py-3.5 px-4">Cuisine & Category</th>
              <th scope="col" className="py-3.5 px-4">Time</th>
              <th scope="col" className="py-3.5 px-4">Difficulty</th>
              <th scope="col" className="py-3.5 px-4">Servings</th>
              <th scope="col" className="py-3.5 px-4">Pantry Match</th>
              <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(138,144,112,0.10)] text-sm">
            {recipes.map((recipe) => {
              const title = recipe.title || recipe.name || 'Untitled';
              const isFav = favorites.has(recipe.id);
              const difficulty = recipe.difficulty || 'MEDIUM';
              const cookTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || recipe.cookTime;
              const match = pantryMatches[recipe.id];
              const matchPct = match !== undefined && match !== null ? Math.round(match <= 1 ? match * 100 : match) : null;

              const diffVariant =
                difficulty.toUpperCase() === 'EASY'
                  ? 'success'
                  : difficulty.toUpperCase() === 'HARD'
                  ? 'danger'
                  : 'warning';

              return (
                <tr
                  key={recipe.id}
                  onClick={() => onRecipeClick(recipe.id)}
                  className="hover:bg-[var(--color-parchment)] transition-colors cursor-pointer group"
                >
                  {/* Title & Fav */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <FavoriteButton
                        isFavorite={isFav}
                        onClick={() => onFavoriteToggle(recipe.id)}
                        size="sm"
                      />
                      <span className="font-bold text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors">
                        {title}
                      </span>
                    </div>
                  </td>

                  {/* Cuisine & Category */}
                  <td className="py-3.5 px-4 text-xs">
                    <span className="font-bold text-[var(--color-dark)]">{recipe.cuisine || recipe.cuisineType || 'General'}</span>
                    {recipe.category && (
                      <span className="text-[var(--color-sage)] block mt-0.5">{recipe.category}</span>
                    )}
                  </td>

                  {/* Time */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-sage)]">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{cookTime ? `${cookTime}m` : '—'}</span>
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3.5 px-4">
                    <Badge variant={diffVariant} size="sm">
                      {difficulty}
                    </Badge>
                  </td>

                  {/* Servings */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-sage)]">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{recipe.servings || 2}</span>
                    </div>
                  </td>

                  {/* Pantry Match */}
                  <td className="py-3.5 px-4">
                    {matchPct !== null ? (
                      <Badge
                        variant={matchPct >= 80 ? 'success' : matchPct >= 50 ? 'warning' : 'danger'}
                        size="sm"
                        dot
                      >
                        {matchPct}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-[var(--color-sage)] opacity-50">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(recipe.id)}
                          aria-label={`Edit ${title}`}
                          className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(recipe)}
                          aria-label={`Delete ${title}`}
                          className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <ChevronRight size={15} className="text-[var(--color-sage)] group-hover:translate-x-1 transition-transform ml-1" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecipeTable;
