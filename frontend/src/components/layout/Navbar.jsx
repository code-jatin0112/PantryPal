import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, Settings, LogOut, ChevronDown, Command } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SearchModal from '../search/SearchModal';

const Navbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Global shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
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

        {/* Middle: Search Bar (Triggers Spotlight Search) */}
        <div
          onClick={() => setSearchModalOpen(true)}
          className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-2 bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.20)] rounded-xl cursor-pointer hover:border-[var(--color-sage)] transition-colors group shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search size={15} className="text-[var(--color-sage)] flex-shrink-0" />
            <span className="text-xs text-[var(--color-sage)] font-medium truncate">
              Search recipes, pantry, meal plans, or ask AI...
            </span>
          </div>

          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-[rgba(138,144,112,0.18)] text-[10px] font-extrabold text-[var(--color-bark)] shadow-xs flex-shrink-0">
            <span className="text-[11px]">⌘</span>
            <span>K</span>
          </div>
        </div>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-3">
          {/* Mobile search trigger */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2.5 rounded-xl text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors md:hidden"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 rounded-xl text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors cursor-pointer"
            aria-label="Open Notifications Center"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
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
              <ChevronDown
                size={14}
                className={`text-[var(--color-sage)] transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[rgba(138,144,112,0.15)] shadow-elevated py-1.5 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-[rgba(138,144,112,0.10)]">
                  <p className="text-xs font-bold text-[var(--color-dark)] truncate">{user?.name}</p>
                  <p className="text-[11px] text-[var(--color-sage)] truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
                  >
                    <User size={14} className="text-[var(--color-sage)]" />
                    <span>Your Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
                  >
                    <Settings size={14} className="text-[var(--color-sage)]" />
                    <span>Settings & Preferences</span>
                  </Link>
                </div>

                <div className="border-t border-[rgba(138,144,112,0.10)] pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Global Spotlight Search Modal ── */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
