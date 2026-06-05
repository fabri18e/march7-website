'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '@/lib/reviews';
import { searchProducts } from '@/lib/search';

type Suggestion =
  | { type: 'product'; product: Product }
  | { type: 'category'; label: string }
  | { type: 'tag'; label: string }
  | { type: 'recent'; query: string };

export default function SearchBar() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []));
  }, []);

  useEffect(() => {
    if (focused) setRecentSearches(getRecentSearches());
  }, [focused]);

  const suggestions = useMemo((): Suggestion[] => {
    if (!query.trim()) {
      return recentSearches.slice(0, 6).map(q => ({ type: 'recent', query: q }));
    }
    const q = query.toLowerCase();

    const matchingProducts = searchProducts(products, query).slice(0, 5);

    // Categories: simple substring match on category name
    const matchingCategories = [
      ...new Set(
        products
          .filter(p => p.category.toLowerCase().includes(q))
          .map(p => p.category)
      ),
    ].slice(0, 2);

    // Tags: check all variants
    const matchingTags = [
      ...new Set(
        products.flatMap(p => p.tags).filter(t => t.toLowerCase().includes(q))
      ),
    ].slice(0, 2);

    return [
      ...matchingProducts.map(p => ({ type: 'product' as const, product: p })),
      ...matchingCategories.map(l => ({ type: 'category' as const, label: l })),
      ...matchingTags.map(l => ({ type: 'tag' as const, label: l })),
    ];
  }, [query, recentSearches]);

  const showDropdown = focused && (
    query.trim() ? suggestions.length > 0 : recentSearches.length > 0
  );

  // Using <form> so pressing Enter naturally submits regardless of other logic
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    addRecentSearch(q);
    setRecentSearches(getRecentSearches());
    setFocused(false);
    setQuery('');
    router.push(`/products?q=${encodeURIComponent(q)}`);
  }, [query, router]);

  const navigateTo = useCallback((suggestion: Suggestion) => {
    setFocused(false);
    setQuery('');
    if (suggestion.type === 'product') {
      addRecentSearch(suggestion.product.name);
      router.push(`/products/${suggestion.product.id}`);
    } else if (suggestion.type === 'category') {
      addRecentSearch(suggestion.label);
      router.push(`/products?category=${encodeURIComponent(suggestion.label)}`);
    } else if (suggestion.type === 'tag') {
      addRecentSearch(suggestion.label);
      router.push(`/products?tag=${encodeURIComponent(suggestion.label)}`);
    } else if (suggestion.type === 'recent') {
      addRecentSearch(suggestion.query);
      router.push(`/products?q=${encodeURIComponent(suggestion.query)}`);
    }
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      if (suggestions[activeIndex]) navigateTo(suggestions[activeIndex]);
    }
    // If Enter with no selection (activeIndex === -1), the <form> onSubmit fires
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setActiveIndex(-1); }, [query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} role="search">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-150 ${
          focused
            ? 'bg-white ring-2 ring-accent shadow-md'
            : 'bg-gray-100 hover:bg-gray-200'
        }`}>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, categories, tags..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5"
              aria-label="Clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
          >
            Search
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-dropdown border border-gray-100 overflow-hidden z-50">
          {!query.trim() && recentSearches.length > 0 && (
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Searches</span>
              <button
                type="button"
                onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); navigateTo(s); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeIndex === i ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              {s.type === 'recent' && (
                <>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                    <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm text-gray-700">{s.query}</span>
                </>
              )}
              {s.type === 'product' && (
                <>
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{s.product.name}</div>
                    <div className="text-xs text-gray-400">{s.product.category} · ${s.product.price.toFixed(2)}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" d="M9 18l6-6-6-6"/>
                  </svg>
                </>
              )}
              {s.type === 'category' && (
                <>
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/>
                      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/>
                      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/>
                      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.label}</div>
                    <div className="text-xs text-gray-400">Browse category</div>
                  </div>
                </>
              )}
              {s.type === 'tag' && (
                <>
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-400">#</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-700">{s.label}</div>
                    <div className="text-xs text-gray-400">Tag</div>
                  </div>
                </>
              )}
            </button>
          ))}

          {query.trim() && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 bg-accent-light rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round"/>
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm text-accent font-medium">
                See all results for &quot;{query}&quot;
              </span>
            </button>
          )}

          {query.trim() && suggestions.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No results for <strong>&quot;{query}&quot;</strong></p>
              <p className="text-xs text-gray-400 mt-1">Press Enter to search anyway</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
