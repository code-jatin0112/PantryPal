import React from 'react';
import { BookOpen, Package, ShoppingCart, Calendar, Heart } from 'lucide-react';

const ProfileStats = ({ stats = {} }) => {
  const statItems = [
    {
      label: 'Recipes Created',
      value: stats.recipesCount ?? 8,
      icon: BookOpen,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Pantry Items',
      value: stats.pantryCount ?? 24,
      icon: Package,
      color: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.12)] border-[rgba(138,144,112,0.25)]',
    },
    {
      label: 'Shopping Items',
      value: stats.shoppingCount ?? 12,
      icon: ShoppingCart,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      label: 'Meal Plans',
      value: stats.mealPlansCount ?? 3,
      icon: Calendar,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: 'Favorite Recipes',
      value: stats.favoritesCount ?? 5,
      icon: Heart,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] text-left space-y-2 flex flex-col justify-between"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.color}`}>
              <Icon size={16} />
            </div>

            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-[var(--color-dark)] block leading-tight tabular-nums">
                {item.value}
              </span>
              <span className="text-xs text-[var(--color-sage)] font-semibold block mt-0.5">
                {item.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileStats;
