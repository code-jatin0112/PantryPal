import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, CornerDownLeft } from 'lucide-react';

import SearchInput from './SearchInput';
import SearchFilters from './SearchFilters';
import SearchResultCard from './SearchResultCard';
import QuickActions from './QuickActions';
import RecentSearches from './RecentSearches';
import SearchEmptyState from './SearchEmptyState';
import SearchSkeleton from './SearchSkeleton';
import { searchGlobal } from '../../services/searchService';

const STORAGE_RECENT_KEY = 'pantrypal_recent_searches';
const MAX_RECENT = 15;

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Recent Searches state
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { query: 'Butter Chicken', isPinned: true },
      { query: 'Olive Oil', isPinned: false },
      { query: 'Mediterranean Plan', isPinned: false },
    ];
  });

  // Save recent searches
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(recentSearches));
    } catch {}
  }, [recentSearches]);

  // Execute Search
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const execute = async () => {
      if (!query.trim() && filter === 'all') {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchGlobal(query, filter);
        if (isMounted) {
          setResults(data);
          setSelectedIndex(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    execute();
    return () => {
      isMounted = false;
    };
  }, [query, filter, isOpen]);

  // Add query to recent searches
  const recordRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const existing = prev.find((x) => (typeof x === 'string' ? x : x.query) === clean);
      const isPinned = existing && typeof existing === 'object' ? existing.isPinned : false;
      const filtered = prev.filter((x) => (typeof x === 'string' ? x : x.query) !== clean);
      return [{ query: clean, isPinned }, ...filtered].slice(0, MAX_RECENT);
    });
  };

  const handleSelectResult = (item) => {
    if (query.trim()) {
      recordRecentSearch(query.trim());
    }
    onClose();
    if (item.url) {
      navigate(item.url);
    }
  };

  // Keyboard navigation within search modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === 'Enter') {
      if (results.length > 0 && results[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  const handleRemoveRecent = (queryText) => {
    setRecentSearches((prev) =>
      prev.filter((x) => (typeof x === 'string' ? x : x.query) !== queryText)
    );
  };

  const handleTogglePin = (queryText) => {
    setRecentSearches((prev) =>
      prev.map((x) => {
        const q = typeof x === 'string' ? x : x.query;
        if (q === queryText) {
          const isPin = typeof x === 'object' ? x.isPinned : false;
          return { query: q, isPinned: !isPin };
        }
        return typeof x === 'string' ? { query: x, isPinned: false } : x;
      })
    );
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  const showInitialView = !query.trim() && filter === 'all';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16"
        onKeyDown={handleKeyDown}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-white rounded-3xl border border-[rgba(138,144,112,0.25)] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[85vh] z-10 text-left"
        >
          {/* Top Search Input Box */}
          <div className="p-3 sm:p-4 border-b border-[rgba(138,144,112,0.15)] bg-white space-y-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              onClear={() => setQuery('')}
              autoFocus
            />

            {/* Filter Pills */}
            <SearchFilters activeFilter={filter} onSelectFilter={setFilter} />
          </div>

          {/* Body Content Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {loading ? (
              <SearchSkeleton />
            ) : showInitialView ? (
              <>
                {/* Recent Searches */}
                <RecentSearches
                  recentSearches={recentSearches}
                  onSelectSearch={setQuery}
                  onRemoveSearch={handleRemoveRecent}
                  onTogglePin={handleTogglePin}
                  onClearAll={handleClearAllRecent}
                />

                {/* Quick Actions */}
                <QuickActions onNavigate={onClose} />
              </>
            ) : results.length === 0 ? (
              <SearchEmptyState
                query={query}
                onSelectSuggestion={(s) => setQuery(s)}
                onClear={() => {
                  setQuery('');
                  setFilter('all');
                }}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 text-xs font-bold text-[var(--color-sage)]">
                  <span>Results ({results.length})</span>
                  <span className="text-[11px] font-semibold">Use ↑↓ to navigate • ↵ to open</span>
                </div>

                <div className="space-y-2">
                  {results.map((item, idx) => (
                    <SearchResultCard
                      key={item.id || idx}
                      result={item}
                      isSelected={idx === selectedIndex}
                      onClick={() => handleSelectResult(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Shortcuts Guide */}
          <div className="px-4 py-2.5 bg-[var(--color-parchment)]/80 border-t border-[rgba(138,144,112,0.15)] flex items-center justify-between text-[11px] font-semibold text-[var(--color-sage)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px] font-bold text-[var(--color-bark)] shadow-xs">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px] font-bold text-[var(--color-bark)] shadow-xs">
                  ↵
                </kbd>
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px] font-bold text-[var(--color-bark)] shadow-xs">
                  ESC
                </kbd>
                <span>Close</span>
              </span>
            </div>

            <span className="hidden sm:inline font-bold text-[var(--color-bark)]">
              PantryPal Global Spotlight
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SearchModal;
