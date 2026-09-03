import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, BookOpen, ShoppingCart,
  CalendarDays, Sparkles, User, Settings, LogOut,
  Menu, X, ChefHat,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { FullPageSpinner } from './components/ui/Spinner';

// ── Lazy-loaded pages (code splitting) ───────────────────
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound     = lazy(() => import('./pages/NotFound'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Pantry       = lazy(() => import('./pages/Pantry'));
const Recipes      = lazy(() => import('./pages/Recipes'));
const ShoppingList = lazy(() => import('./pages/ShoppingList'));
const MealPlanner  = lazy(() => import('./pages/MealPlanner'));
const Assistant    = lazy(() => import('./pages/Assistant'));
const Preferences  = lazy(() => import('./pages/Preferences'));
const Profile      = lazy(() => import('./pages/Profile'));

// ── Navigation items ──────────────────────────────────────
const NAV_ITEMS = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/pantry',        icon: Package,         label: 'My Pantry'          },
  { to: '/recipes',       icon: BookOpen,        label: 'Recipes'            },
  { to: '/shopping-list', icon: ShoppingCart,    label: 'Shopping List'      },
  { to: '/meal-planner',  icon: CalendarDays,    label: 'Meal Planner'       },
  { to: '/assistant',     icon: Sparkles,        label: 'AI Assistant'       },
];

const BOTTOM_NAV = [
  { to: '/preferences', icon: Settings, label: 'Preferences' },
  { to: '/profile',     icon: User,     label: 'Profile'     },
];

// ── Page transition wrapper ───────────────────────────────
const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ── Nav Link ──────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium group ${
        isActive
          ? 'bg-[var(--color-sage)] text-white shadow-sm'
          : 'text-[var(--color-sage)] hover:bg-[rgba(138,144,112,0.10)] hover:text-[var(--color-dark)]'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon
          size={17}
          className={`flex-shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}
        />
        <span className="truncate">{label}</span>
      </>
    )}
  </NavLink>
);

// ── Sidebar ───────────────────────────────────────────────
const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <aside className="w-64 h-full bg-white border-r border-[rgba(138,144,112,0.12)] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center shadow-sm">
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-base font-extrabold text-[var(--color-dark)] tracking-tight">PantryPal</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-widest px-3 mb-2">
          Kitchen
        </p>
        {NAV_ITEMS.map(({ to, icon, label, end }) => (
          <NavItem key={to} to={to} icon={icon} label={label} end={end} onClick={onClose} />
        ))}

        <div className="divider my-4" />

        <p className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-widest px-3 mb-2">
          Account
        </p>
        {BOTTOM_NAV.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} onClick={onClose} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[rgba(138,144,112,0.12)] p-3">
        <NavLink
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-parchment)] transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-sage)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--color-dark)] truncate leading-tight">{user?.name}</p>
            <p className="text-xs text-[var(--color-sage)] truncate">{user?.email}</p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-sage)] hover:bg-red-50 hover:text-red-500 transition-all mt-1"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

// ── App Layout (authenticated shell) ─────────────────────
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--color-parchment)]">

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(39,42,31,0.45)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-[rgba(138,144,112,0.12)] flex-shrink-0 shadow-[0_1px_4px_rgba(39,42,31,0.06)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-[var(--color-sage)] hover:bg-[var(--color-parchment)] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center">
              <ChefHat size={14} className="text-white" />
            </div>
            <span className="font-extrabold text-[var(--color-dark)] text-base tracking-tight">PantryPal</span>
          </div>
        </header>

        {/* Page area */}
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<FullPageSpinner label="Loading page…" />}>
            <PageTransition>
              <Routes>
                <Route path="/"              element={<Dashboard />} />
                <Route path="/pantry"        element={<Pantry />} />
                <Route path="/recipes"       element={<Recipes />} />
                <Route path="/shopping-list" element={<ShoppingList />} />
                <Route path="/meal-planner"  element={<MealPlanner />} />
                <Route path="/assistant"     element={<Assistant />} />
                <Route path="/preferences"   element={<Preferences />} />
                <Route path="/profile"       element={<Profile />} />
                <Route path="*"              element={<NotFound />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────
function App() {
  return (
    <Suspense fallback={<FullPageSpinner label="Starting PantryPal…" />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected app shell */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
