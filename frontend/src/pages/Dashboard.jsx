import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../hooks/usePantry';
import { getMealPlans, getShoppingList, updateShoppingListItem, clearPurchasedItems } from '../services/dashboardService';
import {
  Package, AlertTriangle, TrendingDown, Calendar,
  ShoppingCart, ChefHat, Sparkles, ArrowRight,
  CheckCircle2, Circle, Trash2, RefreshCw
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sublabel }) => (
  <div className="bg-white rounded-2xl border border-sage/20 p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-bark leading-tight">{value}</p>
      <p className="text-sm font-medium text-sage">{label}</p>
      {sublabel && <p className="text-xs text-sage/70 mt-0.5">{sublabel}</p>}
    </div>
  </div>
);

// ─── Alert Row ────────────────────────────────────────────────────────────────
const AlertRow = ({ item, type }) => {
  const daysLeft = item.expirationDate
    ? Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm ${
      type === 'expired' ? 'bg-red-50 text-red-700' :
      type === 'expiring' ? 'bg-amber-50 text-amber-800' :
      'bg-orange-50 text-orange-800'
    }`}>
      <div className="flex items-center gap-2">
        {type === 'lowstock'
          ? <TrendingDown size={14} />
          : <Calendar size={14} />
        }
        <span className="font-medium">{item.name}</span>
        <span className="text-xs opacity-70">{item.quantity} {item.unit}</span>
      </div>
      {daysLeft !== null && (
        <span className="text-xs font-semibold">
          {type === 'expired' ? 'Expired' : `${daysLeft}d left`}
        </span>
      )}
    </div>
  );
};

// ─── Shopping List Widget ──────────────────────────────────────────────────────
const ShoppingWidget = ({ items, onToggle, onClearPurchased }) => {
  const pending = items.filter(i => !i.isPurchased);
  const purchased = items.filter(i => i.isPurchased);

  return (
    <div className="bg-white rounded-2xl border border-sage/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-bark flex items-center gap-2">
          <ShoppingCart size={18} className="text-sage" /> Shopping List
        </h2>
        {purchased.length > 0 && (
          <button onClick={onClearPurchased}
            className="flex items-center gap-1.5 text-xs text-sage hover:text-red-500 transition-colors">
            <Trash2 size={13} /> Clear bought
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sage text-sm text-center py-4">Your shopping list is empty!</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {pending.map(item => (
            <button key={item.id} onClick={() => onToggle(item)}
              className="flex items-center gap-3 w-full text-left hover:bg-parchment rounded-lg p-2 transition-colors group">
              <Circle size={16} className="text-sage group-hover:text-olive flex-shrink-0" />
              <span className="text-sm text-bark flex-1">{item.name}</span>
              <span className="text-xs text-sage">{item.quantity} {item.unit}</span>
            </button>
          ))}
          {purchased.map(item => (
            <button key={item.id} onClick={() => onToggle(item)}
              className="flex items-center gap-3 w-full text-left hover:bg-parchment rounded-lg p-2 transition-colors opacity-50">
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              <span className="text-sm text-bark line-through flex-1">{item.name}</span>
              <span className="text-xs text-sage">{item.quantity} {item.unit}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Meal Plan Widget ──────────────────────────────────────────────────────────
const MealPlanWidget = ({ plans }) => (
  <div className="bg-white rounded-2xl border border-sage/20 p-5">
    <h2 className="font-bold text-bark flex items-center gap-2 mb-4">
      <ChefHat size={18} className="text-sage" /> Upcoming Meal Plans
    </h2>
    {plans.length === 0 ? (
      <p className="text-sage text-sm text-center py-4">No meal plans yet. Plan your week!</p>
    ) : (
      <div className="space-y-3">
        {plans.slice(0, 4).map(plan => (
          <div key={plan.id} className="flex items-center justify-between py-2 border-b border-sage/10 last:border-0">
            <div>
              <p className="text-sm font-medium text-bark">{plan.name}</p>
              <p className="text-xs text-sage">
                {new Date(plan.startDate).toLocaleDateString()} – {new Date(plan.endDate).toLocaleDateString()}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              plan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              plan.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
              'bg-sage/20 text-sage'
            }`}>{plan.status}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Quick Action Card ─────────────────────────────────────────────────────────
const QuickAction = ({ to, icon: Icon, title, desc, gradient }) => (
  <Link to={to} className={`group rounded-2xl p-5 text-white flex flex-col gap-2 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${gradient}`}>
    <Icon size={24} className="opacity-90" />
    <p className="font-bold text-base">{title}</p>
    <p className="text-sm opacity-80 leading-snug">{desc}</p>
    <div className="flex items-center gap-1 text-xs font-semibold mt-auto pt-2 opacity-90">
      Go <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { items, expiringItems, lowStockItems, loading: pantryLoading, activePantry } = usePantry();

  const [shoppingItems, setShoppingItems] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [shoppingRes, mealRes] = await Promise.all([
          getShoppingList().catch(() => ({ data: { data: { items: [] } } })),
          getMealPlans().catch(() => ({ data: { data: { mealPlans: [] } } })),
        ]);
        setShoppingItems(shoppingRes.data.data.items || []);
        setMealPlans(mealRes.data.data.mealPlans || []);
      } catch (_) {}
      setDashLoading(false);
    };
    loadDashboard();
  }, []);

  const handleToggleShopping = async (item) => {
    try {
      await updateShoppingListItem(item.id, { isPurchased: !item.isPurchased });
      setShoppingItems(prev => prev.map(i => i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i));
    } catch (_) {}
  };

  const handleClearPurchased = async () => {
    try {
      await clearPurchasedItems();
      setShoppingItems(prev => prev.filter(i => !i.isPurchased));
    } catch (_) {}
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const expiredItems = expiringItems.filter(i => new Date(i.expirationDate) < new Date());

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-bark">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sage mt-1 text-sm">Here's what's happening in your kitchen today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Items" value={pantryLoading ? '—' : items.length} color="bg-sage" sublabel="in pantry" />
        <StatCard icon={AlertTriangle} label="Expiring Soon" value={pantryLoading ? '—' : expiringItems.length} color="bg-amber-400" sublabel="within 7 days" />
        <StatCard icon={TrendingDown} label="Low Stock" value={pantryLoading ? '—' : lowStockItems.length} color="bg-orange-400" sublabel="below minimum" />
        <StatCard icon={ShoppingCart} label="To Buy" value={dashLoading ? '—' : shoppingItems.filter(i => !i.isPurchased).length} color="bg-bark" sublabel="on shopping list" />
      </div>

      {/* Alerts */}
      {(expiredItems.length > 0 || expiringItems.length > 0 || lowStockItems.length > 0) && (
        <div className="bg-white rounded-2xl border border-sage/20 p-5">
          <h2 className="font-bold text-bark mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Kitchen Alerts
          </h2>
          <div className="space-y-2">
            {expiredItems.slice(0, 3).map(i => <AlertRow key={i.id} item={i} type="expired" />)}
            {expiringItems.filter(i => new Date(i.expirationDate) >= new Date()).slice(0, 3).map(i => <AlertRow key={i.id} item={i} type="expiring" />)}
            {lowStockItems.slice(0, 3).map(i => <AlertRow key={i.id} item={i} type="lowstock" />)}
          </div>
          <Link to="/pantry" className="flex items-center gap-1 text-sage hover:text-bark text-sm font-medium mt-3 transition-colors">
            View all in Pantry <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShoppingWidget
          items={shoppingItems}
          onToggle={handleToggleShopping}
          onClearPurchased={handleClearPurchased}
        />
        <MealPlanWidget plans={mealPlans} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-bark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            to="/pantry"
            icon={Package}
            title="Manage Pantry"
            desc="Add, update, or remove ingredients from your inventory"
            gradient="bg-gradient-to-br from-sage to-bark"
          />
          <QuickAction
            to="/assistant"
            icon={Sparkles}
            title="AI Assistant"
            desc="Ask Gemini to suggest a recipe using what you have"
            gradient="bg-gradient-to-br from-olive to-sage"
          />
          <QuickAction
            to="/pantry"
            icon={ShoppingCart}
            title="Shopping List"
            desc="Review your low-stock items and plan your next grocery run"
            gradient="bg-gradient-to-br from-bark to-[#3d3728]"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
