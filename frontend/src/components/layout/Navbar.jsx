import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Chef';
  const initial = user?.name?.[0]?.toUpperCase() || 'P';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pantry?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[rgba(138,144,112,0.12)] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-[0_1px_3px_rgba(39,42,31,0.02)]">
      {/* Left: Mobile Menu Toggle & Greeting */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:block min-w-0">
          <h1 className="text-sm font-semibold text-[var(--color-dark)] truncate">
            {greeting}, <span className="text-[var(--color-sage)] font-bold">{firstName}</span>
          </h1>
          <p className="text-[11px] text-[var(--color-sage)] opacity-80">
            Welcome to your kitchen command center
          </p>
        </div>
      </div>

      {/* Middle: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pantry items, recipes, or ingredients..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.20)] rounded-xl text-xs text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[rgba(138,144,112,0.15)] transition-all"
          />
        </div>
      </form>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative p-2.5 rounded-xl text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-[1px] bg-[rgba(138,144,112,0.15)] hidden sm:block" />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--color-parchment)] transition-colors text-left group"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--color-sage)] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {initial}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-bold text-[var(--color-dark)] leading-tight">{firstName}</p>
              <p className="text-[10px] text-[var(--color-sage)] leading-none">Home Cook</p>
            </div>
            <ChevronDown size={13} className="text-[var(--color-sage)] group-hover:text-[var(--color-dark)] transition-transform duration-150" />
          </button>

          {/* Profile Dropdown Popup */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-elevated py-2 z-50 animate-scale-in">
              <div className="px-4 py-2 border-b border-[rgba(138,144,112,0.10)] mb-1">
                <p className="text-xs font-bold text-[var(--color-dark)] truncate">{user?.name}</p>
                <p className="text-[11px] text-[var(--color-sage)] truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
              >
                <User size={14} className="text-[var(--color-sage)]" />
                <span>My Profile</span>
              </Link>

              <Link
                to="/preferences"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
              >
                <Settings size={14} className="text-[var(--color-sage)]" />
                <span>Preferences</span>
              </Link>

              <div className="my-1 border-t border-[rgba(138,144,112,0.10)]" />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
