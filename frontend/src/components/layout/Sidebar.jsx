import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ChefHat,
  ShoppingBag,
  CalendarDays,
  Sparkles,
  Bot,
  Settings,
  UtensilsCrossed,
  LogOut,
  User,
} from "lucide-react";
import { ROUTES } from "../../constants/routes";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    path: ROUTES.DASHBOARD || "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Pantry",
    path: ROUTES.PANTRY || "/pantry",
    icon: Package,
  },
  {
    name: "Recipes",
    path: ROUTES.RECIPES || "/recipes",
    icon: ChefHat,
  },
  {
    name: "Shopping List",
    path: ROUTES.SHOPPING_LIST || "/shopping-list",
    icon: ShoppingBag,
  },
  {
    name: "Meal Planner",
    path: ROUTES.MEAL_PLANNER || "/meal-planner",
    icon: CalendarDays,
  },
  {
    name: "AI Recommendations",
    path: ROUTES.AI_RECOMMENDATIONS || "/ai-recommendations",
    icon: Sparkles,
  },
  {
    name: "AI Chat",
    path: ROUTES.AI_CHAT || "/ai-chat",
    icon: Bot,
  },
  {
    name: "Settings",
    path: ROUTES.SETTINGS || "/settings",
    icon: Settings,
  },
];

export const Sidebar = ({ onNavigate, className = "" }) => {
  return (
    <aside
      className={`h-full flex flex-col justify-between bg-[#FAF8F3] text-[#272A1F] select-none ${className}`}
      aria-label="Main Navigation"
    >
      {/* Top Branding Section */}
      <div>
        <div className="p-6 flex items-center gap-3.5 border-b border-[#D8C6A5]/30">
          <div className="w-10 h-10 rounded-xl bg-[#8A9070] flex items-center justify-center text-white shadow-sm shrink-0">
            <UtensilsCrossed className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-[#272A1F] font-sans leading-none">
              PantryPal
            </span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8A9070] mt-1">
              Kitchen Assistant
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5" aria-label="Sidebar Links">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) => `
                  flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#8A9070] text-white shadow-sm font-semibold"
                      : "text-[#272A1F]/80 hover:bg-[#B8C39A]/25 hover:text-[#272A1F]"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile & Logout Placeholder */}
      <div className="p-4 border-t border-[#D8C6A5]/30 bg-[#FAF8F3]/50">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#D8C6A5]/40 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#B8C39A]/40 border border-[#8A9070]/30 flex items-center justify-center text-[#272A1F] shrink-0 font-bold text-xs">
              <User className="w-4 h-4 text-[#5E5947]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#272A1F] truncate leading-tight">
                Chef User
              </p>
              <p className="text-xs text-[#5E5947]/75 truncate mt-0.5">
                chef@pantrypal.app
              </p>
            </div>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg text-[#5E5947] hover:text-red-600 hover:bg-red-50 focus:outline-none transition-colors cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
