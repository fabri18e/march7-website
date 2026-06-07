'use client';

import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Filters from '@/components/Filters';
import { searchProducts } from '@/lib/search';
import { tiktokSearch } from '@/lib/tiktok';

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';
  const prevQuery = useRef('');
  useEffect(() => {
    if (query && query !== prevQuery.current) {
      tiktokSearch(query);
      prevQuery.current = query;
    }
  }, [query]);
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const freeShipping = searchParams.get('freeShipping') === '1';
  const minPrice = Number(searchParams.get('min') || 0);
  const maxPrice = Number(searchParams.get('max') || Infinity);

  const filtered = useMemo(() => {
    const textFiltered = query ? searchProducts(initialProducts, query) : initialProducts;
    return textFiltered.filter(p => {
      if (category && p.category !== category) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (freeShipping && !p.freeShipping) return false;
      if (minPrice && p.price < minPrice) return false;
      if (maxPrice < Infinity && p.price > maxPrice) return false;
      return true;
    });
  }, [initialProducts, query, category, tag, freeShipping, minPrice, maxPrice]);

  const hasActiveFilter = query || category || tag || freeShipping;
  const activeFilterCount = [category, tag, freeShipping ? '1' : ''].filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {query ? `Results for "${query}"` : category ? category : tag ? `#${tag}` : 'All Products'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilter && (
              <a href="/products" className="ml-3 text-accent hover:underline">Clear filters</a>
            )}
          </p>
        </div>

        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.8" strokeLinecap="round" d="M3 6h18M7 12h10M11 18h2"/>
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-accent text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-8 lg:gap-10">
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <Suspense>
            <Filters products={initialProducts} activeCategory={category} activeTag={tag} activeFreeShipping={freeShipping} />
          </Suspense>
        </aside>

        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="1.5"/>
                  <path d="m21 21-4.35-4.35" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No products found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {query ? `No results for "${query}". Try a different term.` : 'No products match the current filters.'}
              </p>
              <a href="/products" className="text-sm text-accent hover:underline">View all products →</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
              {filtered.map(p => <ProductCard key={p.id} product={p} allProducts={initialProducts} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">
              <Suspense>
                <Filters products={initialProducts} activeCategory={category} activeTag={tag} activeFreeShipping={freeShipping} />
              </Suspense>
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={() => setMobileFiltersOpen(false)} className="w-full bg-accent text-white font-semibold py-3 rounded-xl transition-colors">
                Show {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
