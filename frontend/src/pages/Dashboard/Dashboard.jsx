import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  BookOpen,
  ShoppingCart,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

import StatCard from '../../components/dashboard/StatCard';
import PantryOverview from '../../components/dashboard/PantryOverview';
import ExpiringItems from '../../components/dashboard/ExpiringItems';
import LowStockItems from '../../components/dashboard/LowStockItems';
import MealPlanPreview from '../../components/dashboard/MealPlanPreview';
import ShoppingPreview from '../../components/dashboard/ShoppingPreview';
import AIRecommendationCard from '../../components/dashboard/AIRecommendationCard';
import QuickActions from '../../components/dashboard/QuickActions';

import {
  getDashboardSummary,
  getPantryOverview,
  getExpiringItems,
  getLowStockItems,
  getMealPlan,
  getShoppingPreview,
  getAIRecommendations,
} from '../../services/dashboardService';
import { StatCardSkeleton } from '../../components/ui/Skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    pantryItems: 0,
    recipes: 0,
    shoppingList: 0,
    mealPlans: 0,
  });
  const [pantryItems, setPantryItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        const [
          summaryRes,
          pantryRes,
          expiringRes,
          lowStockRes,
          mealPlanRes,
          shoppingRes,
          aiRes,
        ] = await Promise.all([
          getDashboardSummary(),
          getPantryOverview(),
          getExpiringItems(),
          getLowStockItems(),
          getMealPlan(),
          getShoppingPreview(),
          getAIRecommendations(),
        ]);

        if (isMounted) {
          if (summaryRes?.data) setSummary(summaryRes.data);
          if (pantryRes?.data) setPantryItems(pantryRes.data);
          if (expiringRes?.data) setExpiringItems(expiringRes.data);
          if (lowStockRes?.data) setLowStockItems(lowStockRes.data);
          if (mealPlanRes?.data) setTodayMeals(mealPlanRes.data);
          if (shoppingRes?.data) setShoppingItems(shoppingRes.data);
          if (aiRes?.data) setAiRecommendations(aiRes.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8"
    >
      {/* ── SECTION 1: Statistics Cards ── */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <StatCardSkeleton key={idx} />
          ))
        ) : (
          <>
            <StatCard
              icon={Package}
              title="Pantry Items"
              value={summary.pantryItems}
              description="Ingredients in active stock"
              trend={{ positive: true, value: '12%', label: 'vs last month' }}
              onClick={() => navigate('/pantry')}
            />
            <StatCard
              icon={BookOpen}
              title="Recipes"
              value={summary.recipes}
              description="Available & matched recipes"
              trend={{ positive: true, value: '4 new', label: 'this week' }}
              onClick={() => navigate('/recipes')}
            />
            <StatCard
              icon={ShoppingCart}
              title="Shopping List"
              value={summary.shoppingList}
              description="Items pending purchase"
              trend={{ positive: false, value: '3 items', label: 'needed soon' }}
              onClick={() => navigate('/shopping-list')}
            />
            <StatCard
              icon={CalendarDays}
              title="Meal Plans"
              value={summary.mealPlans}
              description="Active & upcoming schedules"
              trend={{ positive: true, value: '7 days', label: 'covered' }}
              onClick={() => navigate('/meal-planner')}
            />
          </>
        )}
      </motion.div>

      {/* ── SECTION 2, 3, 4: Inventory Health Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 2: Pantry Overview */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <PantryOverview items={pantryItems} />
        </motion.div>

        {/* SECTION 3: Expiring Soon */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <ExpiringItems items={expiringItems} />
        </motion.div>

        {/* SECTION 4: Low Stock */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <LowStockItems items={lowStockItems} />
        </motion.div>
      </div>

      {/* ── SECTION 5, 6, 7: Meal Planning & AI Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 5: Today's Meal Plan */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <MealPlanPreview meals={todayMeals} />
        </motion.div>

        {/* SECTION 6: Shopping List Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <ShoppingPreview initialItems={shoppingItems} />
        </motion.div>

        {/* SECTION 7: AI Recommendation Widget */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <AIRecommendationCard recommendations={aiRecommendations} />
        </motion.div>
      </div>

      {/* ── SECTION 8: Quick Actions ── */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
