import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../hooks/usePantry';
import { getMealPlans, getShoppingList, updateShoppingListItem, clearPurchasedItems } from '../services/dashboardService';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import {
  Package, AlertTriangle, TrendingDown, ShoppingCart, ChefHat,
  Sparkles, ArrowRight, CheckCircle2, Circle, Trash2, Calendar,
  BookOpen,
} from 'lucide-react';

// ── Animation variants ─────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease: 'easeOut' },
  }),
};

// ── Stat Card ─────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sublabel, gradient, index }) => (
  <motion.div
    variants={fadeUp}
    custom={index}
    initial="hidden"
    animate="visible"
    className="stat-card flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold text-[var(--color-dark)] leading-tight tabular-nums">{value}</p>
      <p className="text-sm font-medium text-[var(--color-sage)] truncate">{label}</p>
      {sublabel && <p className="text-xs text-[var(--color-sage)] opacity-70 mt-0.5">{sublabel}</p>}
    </div>
  </motion.div>
);

// ── Alert Row ─────────────────────────────────────────────
const AlertRow = ({ item, type }) => {
  const daysLeft = item.expirationDate
    ? Math.ceil((new Date(item.expirationDate) - new Date()) / 86400000)
    : null;

  const styles = {
    expired: { bg: 'bg-[var(--color-danger-bg)] border-[rgba(217,92,92,0.2)]', text: 'text-[var(--color-danger)]', badge: 'Expired' },
    expiring:{ bg: 'bg-[var(--color-warning-bg)] border-[rgba(217,164,65,0.2)]', text: 'text-[var(--color-warning)]', badge: `${daysLeft}d left` },
    lowstock:{ bg: 'bg-[rgba(255,165,0,0.07)] border-[rgba(255,165,0,0.2)]',     text: 'text-orange-600', badge: 'Low stock' },
  }[type];

  return (
    <div className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm border ${styles.bg}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {type === 'lowstock' ? <TrendingDown size={14} className={styles.text} /> : <Calendar size={14} className={styles.text} />}
        <span className={`font-semibold truncate ${styles.text}`}>{item.name}</span>
        <span className="text-xs opacity-60 flex-shrink-0">{item.quantity} {item.unit}</span>
      </div>
      <span className={`text-xs font-bold flex-shrink-0 ml-2 ${styles.text}`}>{styles.badge}</span>
    </div>
  );
};

// ── Shopping Widget ────────────────────────────────────────
const ShoppingWidget = ({ items, onToggle, onClearPurchased }) => {
  const pending   = items.filter((i) => !i.isPurchased);
  const purchased = items.filter((i) =>  i.isPurchased);

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[var(--color-dark)] flex items-center gap-2">
          <ShoppingCart size={17} className="text-[var(--color-sage)]" />
          Shopping List
        </h2>
        {purchased.length > 0 && (
          <button onClick={onClearPurchased} className="flex items-center gap-1 text-xs text-[var(--color-sage)] hover:text-red-500 transition-colors font-medium">
            <Trash2 size={12} /> Clear bought
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
          <CheckCircle2 size={32} className="text-[var(--color-success)]" />
          <p className="text-sm text-[var(--color-sage)] font-medium">Your list is empty!</p>
          <Link to="/shopping-list" className="text-xs text-[var(--color-bark)] font-semibold hover:underline">
            Add items →
          </Link>
        </div>
      ) : (
        <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none">
          {pending.map((item) => (
            <button key={item.id} onClick={() => onToggle(item)}
              className="flex items-center gap-3 w-full text-left hover:bg-[var(--color-parchment)] rounded-xl p-2.5 transition-colors group">
              <Circle size={15} className="text-[rgba(138,144,112,0.4)] group-hover:text-[var(--color-sage)] flex-shrink-0" />
              <span className="text-sm text-[var(--color-dark)] flex-1 truncate">{item.name}</span>
              <span className="text-xs text-[var(--color-sage)] flex-shrink-0">{item.quantity} {item.unit}</span>
            </button>
          ))}
          {purchased.map((item) => (
            <button key={item.id} onClick={() => onToggle(item)}
              className="flex items-center gap-3 w-full text-left hover:bg-[var(--color-parchment)] rounded-xl p-2.5 transition-colors opacity-50">
              <CheckCircle2 size={15} className="text-[var(--color-success)] flex-shrink-0" />
              <span className="text-sm text-[var(--color-dark)] line-through flex-1 truncate">{item.name}</span>
              <span className="text-xs text-[var(--color-sage)] flex-shrink-0">{item.quantity} {item.unit}</span>
            </button>
          ))}
        </div>
      )}

      <Link to="/shopping-list" className="flex items-center gap-1 text-xs text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors font-medium mt-4 pt-3 border-t border-[rgba(138,144,112,0.10)]">
        View full list <ArrowRight size={12} />
      </Link>
    </div>
  );
};

// ── Meal Plan Widget ───────────────────────────────────────
const MealPlanWidget = ({ plans }) => (
  <div className="card p-5 h-full flex flex-col">
    <h2 className="text-base font-bold text-[var(--color-dark)] flex items-center gap-2 mb-4">
      <ChefHat size={17} className="text-[var(--color-sage)]" />
      Meal Plans
    </h2>
    {plans.length === 0 ? (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
        <Calendar size={32} className="text-[var(--color-olive)]" />
        <p className="text-sm text-[var(--color-sage)] font-medium">No plans yet</p>
        <Link to="/meal-planner" className="text-xs text-[var(--color-bark)] font-semibold hover:underline">
          Plan your week →
        </Link>
      </div>
    ) : (
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none">
        {plans.slice(0, 4).map((plan) => (
          <div key={plan.id} className="flex items-center justify-between py-2.5 border-b border-[rgba(138,144,112,0.10)] last:border-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-dark)] truncate">{plan.name}</p>
              <p className="text-xs text-[var(--color-sage)]">
                {new Date(plan.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
                {new Date(plan.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ml-2 ${
              plan.status === 'ACTIVE'    ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' :
              plan.status === 'DRAFT'     ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]' :
              'bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)]'
            }`}>{plan.status}</span>
          </div>
        ))}
      </div>
    )}
    <Link to="/meal-planner" className="flex items-center gap-1 text-xs text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors font-medium mt-4 pt-3 border-t border-[rgba(138,144,112,0.10)]">
      View all plans <ArrowRight size={12} />
    </Link>
  </div>
);

// ── Quick Action Card ──────────────────────────────────────
const QuickAction = ({ to, icon: Icon, title, desc, gradient, index }) => (
  <motion.div
    variants={fadeUp}
    custom={index}
    initial="hidden"
    animate="visible"
  >
    <Link
      to={to}
      className={`group rounded-2xl p-5 text-white flex flex-col gap-2.5 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 ${gradient}`}
    >
      <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
        <Icon size={20} className="text-white" />
      </div>
      <p className="font-bold text-base leading-tight">{title}</p>
      <p className="text-sm opacity-75 leading-snug">{desc}</p>
      <div className="flex items-center gap-1 text-xs font-semibold mt-auto opacity-80">
        Go <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  </motion.div>
);

// ── Main Dashboard ─────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { items, expiringItems, lowStockItems, loading: pantryLoading } = usePantry();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [mealPlans, setMealPlans]         = useState([]);
  const [dashLoading, setDashLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, mRes] = await Promise.all([
          getShoppingList().catch(() => ({ data: { data: { items: [] } } })),
          getMealPlans().catch(() => ({ data: { data: { mealPlans: [] } } })),
        ]);
        setShoppingItems(sRes.data.data.items || []);
        setMealPlans(mRes.data.data.mealPlans || []);
      } finally {
        setDashLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleShopping = async (item) => {
    try {
      await updateShoppingListItem(item.id, { isPurchased: !item.isPurchased });
      setShoppingItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i));
    } catch { /* silent */ }
  };

  const handleClearPurchased = async () => {
    try {
      await clearPurchasedItems();
      setShoppingItems((prev) => prev.filter((i) => !i.isPurchased));
    } catch { /* silent */ }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Chef';
  const expiredItems = expiringItems.filter((i) => new Date(i.expirationDate) < new Date());
  const soonItems    = expiringItems.filter((i) => new Date(i.expirationDate) >= new Date());

  const STATS = [
    { icon: Package,       label: 'Total Items',   value: pantryLoading ? '—' : items.length,                          sublabel: 'in pantry',         gradient: 'bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)]' },
    { icon: AlertTriangle, label: 'Expiring Soon', value: pantryLoading ? '—' : expiringItems.length,                  sublabel: 'within 7 days',     gradient: 'bg-gradient-to-br from-amber-400 to-orange-500' },
    { icon: TrendingDown,  label: 'Low Stock',     value: pantryLoading ? '—' : lowStockItems.length,                  sublabel: 'below minimum',     gradient: 'bg-gradient-to-br from-orange-400 to-red-400' },
    { icon: ShoppingCart,  label: 'To Buy',        value: dashLoading   ? '—' : shoppingItems.filter((i) => !i.isPurchased).length, sublabel: 'on list', gradient: 'bg-gradient-to-br from-[var(--color-bark)] to-[var(--color-dark)]' },
  ];

  return (
    <div className="page-container space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="page-title">
          {greeting},{' '}
          <span className="text-gradient">{firstName}</span>
          {' '}👋
        </h1>
        <p className="page-subtitle mt-1">Here's what's happening in your kitchen today.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {pantryLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : STATS.map((s, i) => <StatCard key={s.label} {...s} index={i} />)
        }
      </div>

      {/* Kitchen Alerts */}
      {(expiredItems.length > 0 || soonItems.length > 0 || lowStockItems.length > 0) && (
        <motion.div
          variants={fadeUp} custom={4} initial="hidden" animate="visible"
          className="card p-5"
        >
          <h2 className="text-base font-bold text-[var(--color-dark)] mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--color-warning)]" />
            Kitchen Alerts
          </h2>
          <div className="space-y-2">
            {expiredItems.slice(0, 2).map((i) => <AlertRow key={i.id} item={i} type="expired" />)}
            {soonItems.slice(0, 2).map((i) => <AlertRow key={i.id} item={i} type="expiring" />)}
            {lowStockItems.slice(0, 2).map((i) => <AlertRow key={i.id} item={i} type="lowstock" />)}
          </div>
          <Link
            to="/pantry"
            className="flex items-center gap-1 text-xs text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors font-medium mt-3 pt-3 border-t border-[rgba(138,144,112,0.10)]"
          >
            View all in Pantry <ArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      {/* Widgets */}
      <motion.div
        variants={fadeUp} custom={5} initial="hidden" animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <ShoppingWidget
          items={shoppingItems}
          onToggle={handleToggleShopping}
          onClearPurchased={handleClearPurchased}
        />
        <MealPlanWidget plans={mealPlans} />
      </motion.div>

      {/* Quick Actions */}
      <div>
        <motion.h2
          variants={fadeUp} custom={6} initial="hidden" animate="visible"
          className="text-base font-bold text-[var(--color-dark)] mb-4"
        >
          Quick Actions
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            to="/pantry" index={7}
            icon={Package}
            title="Manage Pantry"
            desc="Add, update, or remove ingredients from your inventory"
            gradient="bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)]"
          />
          <QuickAction
            to="/assistant" index={8}
            icon={Sparkles}
            title="AI Assistant"
            desc="Ask Gemini to suggest a recipe using what you have"
            gradient="bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-sage)]"
          />
          <QuickAction
            to="/recipes" index={9}
            icon={BookOpen}
            title="Browse Recipes"
            desc="Discover recipes matched against your pantry stock"
            gradient="bg-gradient-to-br from-[var(--color-bark)] to-[var(--color-dark)]"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
