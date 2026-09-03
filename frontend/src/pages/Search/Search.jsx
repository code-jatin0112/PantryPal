import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Sparkles } from 'lucide-react';

import SearchInput from '../../components/search/SearchInput';
import SearchFilters from '../../components/search/SearchFilters';
import SearchResultCard from '../../components/search/SearchResultCard';
import QuickActions from '../../components/search/QuickActions';
import RecentSearches from '../../components/search/RecentSearches';
import SearchEmptyState from '../../components/search/SearchEmptyState';
import SearchSkeleton from '../../components/search/SearchSkeleton';
import SearchCategory from '../../components/search/SearchCategory';
import { searchGlobal } from '../../services/searchService';

const STORAGE_RECENT_KEY = 'pantrypal_recent_searches';
const MAX_RECENT = 15;

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialFilter = searchParams.get('filter') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Sync URL params
  useEffect(() => {
    const params = {};
    if (query) params.q = query;
    if (filter !== 'all') params.filter = filter;
    setSearchParams(params, { replace: true });
  }, [query, filter, setSearchParams]);

  // Execute Search
  useEffect(() => {
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
        if (isMounted) setResults(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    execute();
    return () => {
      isMounted = false;
    };
  }, [query, filter]);

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
    if (item.url) {
      navigate(item.url);
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

  const showInitialView = !query.trim() && filter === 'all';

  // Grouped results
  const groupedResults = {
    recipes: results.filter((r) => r.category === 'recipes'),
    pantry: results.filter((r) => r.category === 'pantry'),
    meal_plans: results.filter((r) => r.category === 'meal_plans'),
    shopping: results.filter((r) => r.category === 'shopping'),
    ai: results.filter((r) => r.category === 'ai'),
    notifications: results.filter((r) => r.category === 'notifications'),
    settings: results.filter((r) => r.category === 'settings'),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-5xl mx-auto text-left"
    >
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center">
            <SearchIcon size={16} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Global Kitchen Search
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[var(--color-sage)] font-semibold mt-1">
          Search across recipes, pantry inventory, meal plans, grocery lists, and settings
        </p>
      </div>

      {/* ── Search Input & Filters Card ── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[rgba(138,144,112,0.18)] shadow-[0_2px_12px_rgba(39,42,31,0.04)] space-y-3.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          autoFocus
        />

        <SearchFilters activeFilter={filter} onSelectFilter={setFilter} />
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <SearchSkeleton />
      ) : showInitialView ? (
        <div className="space-y-6">
          <RecentSearches
            recentSearches={recentSearches}
            onSelectSearch={setQuery}
            onRemoveSearch={handleRemoveRecent}
            onTogglePin={handleTogglePin}
            onClearAll={handleClearAllRecent}
          />
          <QuickActions />
        </div>
      ) : results.length === 0 ? (
        <SearchEmptyState
          query={query}
          onSelectSuggestion={(s) => setQuery(s)}
          onClear={() => {
            setQuery('');
            setFilter('all');
          }}
        />
      ) : filter !== 'all' ? (
        /* Flat filtered view */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Search Results
            </h3>
            <span className="text-[11px] font-semibold text-[var(--color-sage)]">
              {results.length} found
            </span>
          </div>
          <div className="space-y-2">
            {results.map((item) => (
              <SearchResultCard
                key={item.id}
                result={item}
                onClick={() => handleSelectResult(item)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Grouped categorized view */
        <div className="space-y-6">
          <SearchCategory title="Recipes" count={groupedResults.recipes.length}>
            {groupedResults.recipes.map((item) => (
              <SearchResultCard
                key={item.id}
                result={item}
                onClick={() => handleSelectResult(item)}
              />
            ))}
          </SearchCategory>

          <SearchCategory title="Pantry Inventory" count={groupedResults.pantry.length}>
            {groupedResults.pantry.map((item) => (
              <SearchResultCard
                key={item.id}
                result={item}
                onClick={() => handleSelectResult(item)}
              />
            ))}
          </SearchCategory>

          <SearchCategory title="Meal Plans" count={groupedResults.meal_plans.length}>
            {groupedResults.meal_plans.map((item) => (
              <SearchResultCard
                key={item.id}
                result={item}
                onClick={() => handleSelectResult(item)}
              />
            ))}
          </SearchCategory>

          <SearchCategory title="Shopping Lists" count={groupedResults.shopping.length}>
            {groupedResults.shopping.map((item) => (
              <SearchResultCard
                key={item.id}
                result={item}
                onClick={() => handleSelectResult(item)}
              />
            ))}
          </SearchCategory>

          <SearchCategory title="AI Intelligence & Cooking" count={groupedResults.ai.length}>
            {groupedResults.ai.map((item) => (
              <SearchResultCard
                key={item.id}
                result={item}
                onClick={() => handleSelectResult(item)}
              />
            ))}
          </SearchCategory>

          <SearchCategory title="Notifications & Settings" count={groupedResults.settings.length + groupedResults.notifications.length}>
            {[...groupedResults.notifications, ...groupedResults.settings].map((item) => (
              <SearchResultCard
                key={item.id}
                result={item}
                onClick={() => handleSelectResult(item)}
              />
            ))}
          </SearchCategory>
        </div>
      )}
    </motion.div>
  );
};

export default SearchPage;
