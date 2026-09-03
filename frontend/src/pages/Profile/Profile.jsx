import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Settings,
  BookOpen,
  Package,
  ShoppingCart,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';

import ProfileCard from '../../components/settings/ProfileCard';
import ProfileStats from '../../components/settings/ProfileStats';
import EditProfileModal from '../../components/settings/EditProfileModal';
import ChangePasswordModal from '../../components/settings/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getRecipes } from '../../services/recipeService';
import { getMealPlans } from '../../services/mealPlanService';
import { getShoppingList } from '../../services/shoppingListService';
import { getPantries, getPantryItems } from '../../services/pantryService';
import { getCurrentUserProfile } from '../../services/preferenceService';

const STORAGE_PROFILE_KEY = 'pantrypal_user_profile';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: user?.name || 'Chef Gourmet',
      email: user?.email || 'chef@pantrypal.app',
      bio: user?.bio || '',
      photoUrl: null,
    };
  });

  const [stats, setStats] = useState({
    recipesCount: 0,
    pantryCount: 0,
    shoppingCount: 0,
    mealPlansCount: 0,
    favoritesCount: 0,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  // Load live statistics from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pantriesRes, recipesRes, mealPlansRes, shoppingRes] = await Promise.allSettled([
          getPantries(),
          getRecipes(),
          getMealPlans(),
          getShoppingList(),
        ]);

        let livePantryCount = 0;
        if (pantriesRes.status === 'fulfilled') {
          const pantries = pantriesRes.value.data?.data?.pantries || pantriesRes.value.data?.data || [];
          if (pantries.length > 0) {
            try {
              const itemsRes = await getPantryItems(pantries[0].id);
              const items = itemsRes.data?.data?.items || itemsRes.data?.data || [];
              livePantryCount = items.length;
            } catch {
              livePantryCount = 0;
            }
          }
        }

        const recipes = recipesRes.status === 'fulfilled' ? recipesRes.value.data?.data?.recipes || recipesRes.value.data?.data || [] : [];
        const mealPlans = mealPlansRes.status === 'fulfilled' ? mealPlansRes.value.data?.data?.mealPlans || mealPlansRes.value.data?.data || [] : [];
        const shopping = shoppingRes.status === 'fulfilled' ? shoppingRes.value.data?.data?.items || shoppingRes.value.data?.data || [] : [];
        const favorites = recipes.filter((r) => r.isFavorite);

        setStats({
          recipesCount: recipes.length,
          pantryCount: livePantryCount,
          shoppingCount: shopping.length,
          mealPlansCount: mealPlans.length,
          favoritesCount: favorites.length,
        });
      } catch {}
    };

    fetchStats();
  }, []);

  // Save profile edits
  const handleSaveProfile = (updated) => {
    const next = { ...profileData, ...updated };
    setProfileData(next);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    toast('Logged out successfully. See you soon!', 'info');
    navigate('/login');
  };

  const quickHubLinks = [
    {
      title: 'AI Recipe Recommendations',
      desc: 'Discover personalized dinners matched to your inventory',
      icon: Sparkles,
      to: '/ai-recommendations',
      badge: 'AI Smart',
    },
    {
      title: 'Kitchen Inventory (Pantry)',
      desc: 'Manage containers, track shelf-life, and detect low stock',
      icon: Package,
      to: '/pantry',
    },
    {
      title: 'Cookbook & Saved Recipes',
      desc: 'Browse recipe collection, scale portions, and launch cooking mode',
      icon: BookOpen,
      to: '/recipes',
    },
    {
      title: 'Weekly Meal Planner',
      desc: 'Organize breakfast, lunch, and dinner menus with automatic grocery sync',
      icon: Calendar,
      to: '/meal-plans',
    },
    {
      title: 'Smart Grocery Shopping List',
      desc: 'Check off purchased ingredients with priority categorization',
      icon: ShoppingCart,
      to: '/shopping-list',
    },
    {
      title: 'Kitchen Settings & AI Preferences',
      desc: 'Customize dietary restrictions, measurement units, and notifications',
      icon: Settings,
      to: '/settings',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 sm:space-y-8 max-w-5xl mx-auto text-left"
    >
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
          Chef Profile & Activity
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-sage)] font-semibold mt-1">
          Manage your personal chef details, account credentials, and kitchen statistics
        </p>
      </div>

      {/* ── Main Profile Card ── */}
      <ProfileCard
        user={{ ...user, name: profileData.name, email: profileData.email }}
        profileData={profileData}
        onEditProfile={() => setIsEditOpen(true)}
        onChangePassword={() => setIsPasswordOpen(true)}
        onLogout={handleLogout}
      />

      {/* ── Statistics Grid ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
          Kitchen Activity & Statistics
        </h3>
        <ProfileStats stats={stats} />
      </div>

      {/* ── Quick Hub Navigation ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
          Quick Kitchen Hub
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickHubLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.to}
                className="p-4 rounded-2xl bg-white border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated hover:border-[var(--color-sage)] transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center group-hover:bg-[var(--color-sage)] group-hover:text-white transition-colors">
                    <Icon size={18} />
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowRight
                      size={13}
                      className="text-[var(--color-sage)] group-hover:translate-x-1 transition-transform"
                    />
                  </h4>
                  <p className="text-[11px] text-[var(--color-sage)] mt-0.5 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Modals ── */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={profileData}
        onSave={handleSaveProfile}
      />

      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
      />
    </motion.div>
  );
};

export default Profile;
