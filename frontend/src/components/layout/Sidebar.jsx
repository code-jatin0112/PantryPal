import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  ShoppingCart,
  CalendarDays,
  ChefHat,
  Sparkles,
  Bot,
  Settings,
  LogOut,
  X,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_MAIN = [
  { to: '/',                   icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/pantry',             icon: Package,         label: 'Pantry' },
  { to: '/recipes',            icon: BookOpen,        label: 'Recipes' },
  { to: '/shopping-list',      icon: ShoppingCart,    label: 'Shopping List' },
  { to: '/meal-planner',       icon: CalendarDays,    label: 'Meal Plans' },
];

const NAV_AI_TOOLS = [
  { to: '/recipes',            icon: Flame,           label: 'Cooking Mode' },
  { to: '/recipes',            icon: Sparkles,        label: 'AI Recommendations' },
  { to: '/assistant',          icon: Bot,             label: 'AI Chat' },
];

const NAV_SETTINGS = [
  { to: '/preferences',        icon: Settings,        label: 'Settings' },
];

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initial = user?.name?.[0]?.toUpperCase() || 'P';

  return (
    <aside className="w-64 h-full bg-white border-r border-[rgba(138,144,112,0.15)] flex flex-col flex-shrink-0 select-none shadow-[1px_0_4px_rgba(39,42,31,0.02)]">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-sage)] flex items-center justify-center text-white shadow-sm">
            <ChefHat size={18} />
          </div>
          <div>
            <span className="text-base font-extrabold text-[var(--color-dark)] tracking-tight block leading-tight">
              PantryPal
            </span>
            <span className="text-[10px] font-medium text-[var(--color-sage)] uppercase tracking-wider block">
              Smart Kitchen
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-none">
        {/* Main Section */}
        <div>
          <p className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-widest px-3 mb-2 opacity-80">
            Kitchen Management
          </p>
          <div className="space-y-1">
            {NAV_MAIN.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-[var(--color-sage)] text-white shadow-sm'
                      : 'text-[var(--color-bark)] hover:bg-[var(--color-parchment)] hover:text-[var(--color-dark)]'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`flex-shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-[var(--color-sage)] group-hover:scale-110'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* AI & Features Section */}
        <div>
          <p className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-widest px-3 mb-2 opacity-80">
            AI & Features
          </p>
          <div className="space-y-1">
            {NAV_AI_TOOLS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to && item.label === 'AI Chat';

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-[var(--color-sage)] text-white shadow-sm'
                      : 'text-[var(--color-bark)] hover:bg-[var(--color-parchment)] hover:text-[var(--color-dark)]'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`flex-shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-[var(--color-sage)] group-hover:scale-110'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Account & Settings */}
        <div>
          <p className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-widest px-3 mb-2 opacity-80">
            System
          </p>
          <div className="space-y-1">
            {NAV_SETTINGS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-[var(--color-sage)] text-white shadow-sm'
                      : 'text-[var(--color-bark)] hover:bg-[var(--color-parchment)] hover:text-[var(--color-dark)]'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`flex-shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-[var(--color-sage)] group-hover:scale-110'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Session Footer */}
      <div className="border-t border-[rgba(138,144,112,0.12)] p-3 bg-white">
        <NavLink
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-parchment)] transition-colors group mb-1"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--color-sage)] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--color-dark)] truncate leading-tight">
              {user?.name || 'Chef'}
            </p>
            <p className="text-xs text-[var(--color-sage)] truncate">
              {user?.email || 'Home Cook'}
            </p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-sage)] hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
