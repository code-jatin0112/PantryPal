import React from "react";
import { Search, Bell, Menu, User } from "lucide-react";

export const Navbar = ({ onOpenMobileSidebar, className = "" }) => {
  // Determine dynamic greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header
      className={`sticky top-0 z-20 w-full bg-[#FAF8F3]/90 backdrop-blur-md border-b border-[#D8C6A5]/40 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 select-none ${className}`}
      aria-label="Top Bar"
    >
      {/* Left: Mobile Drawer Trigger & Greeting */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-[#272A1F] hover:bg-[#B8C39A]/20 focus:outline-none focus:ring-2 focus:ring-[#8A9070] transition-colors cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#272A1F] tracking-tight leading-tight">
            {getGreeting()}, Chef
          </h1>
          <p className="hidden sm:block text-xs text-[#5E5947]/75">
            Ready to cook mindful meals today?
          </p>
        </div>
      </div>

      {/* Center/Right: Search Bar & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input (UI Only) */}
        <div className="relative hidden md:flex items-center w-64 lg:w-80">
          <div className="absolute left-3.5 pointer-events-none text-[#5E5947]/70 flex items-center">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="search"
            placeholder="Search pantry, recipes..."
            className="w-full bg-white text-sm text-[#272A1F] placeholder-[#5E5947]/50 rounded-xl border border-[#D8C6A5]/60 pl-10 pr-4 py-2 shadow-sm focus:outline-none focus:border-[#8A9070] focus:ring-2 focus:ring-[#8A9070]/20 transition-all"
            aria-label="Search ingredients and recipes"
          />
        </div>

        {/* Notification Bell Icon */}
        <button
          type="button"
          className="relative p-2.5 rounded-xl bg-white border border-[#D8C6A5]/40 text-[#272A1F] hover:bg-[#B8C39A]/15 focus:outline-none focus:ring-2 focus:ring-[#8A9070] shadow-sm transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-[#5E5947]" aria-hidden="true" />
          {/* Notification badge indicator */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8A9070] ring-2 ring-white" />
        </button>

        {/* User Avatar Placeholder */}
        <div
          className="w-9 h-9 rounded-xl bg-[#8A9070] border border-[#8A9070]/40 flex items-center justify-center text-white shadow-sm font-semibold text-xs shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          title="User Profile"
          aria-label="User Profile"
        >
          <User className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;

