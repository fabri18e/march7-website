'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Filters from '@/components/Filters';
import { searchProducts } from '@/lib/search';

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoadingProducts(false); });
  }, []);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const freeShipping = searchParams.get('freeShipping') === '1';
  const minPrice = Number(searchParams.get('min') || 0);
  const maxPrice = Number(searchParams.get('max') || Infinity);

  const filtered = useMemo(() => {
    const textFiltered = query ? searchProducts(products, query) : products;
    return textFiltered.filter(p => {
      if (category && p.category !== category) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (freeShipping && !p.freeShipping) return false;
      if (minPrice && p.price < minPrice) return false;
      if (maxPrice < Infinity && p.price > maxPrice) return false;
      return true;
    });
  }, [products, query, category, tag, freeShipping, minPrice, maxPrice]);

  const hasActiveFilter = query || category || tag || freeShipping;

  if (loadingProducts) return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-gray-400">Loading products...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {query ? `Results for "${query}"` : category ? category : tag ? `#${tag}` : 'All Products'}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {hasActiveFilter && (
            <a href="/products" className="ml-3 text-accent hover:underline">Clear filters</a>
          )}
        </p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <Suspense>
            <Filters
              products={products}
              activeCategory={category}
              activeTag={tag}
              activeFreeShipping={freeShipping}
            />
          </Suspense>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
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
              <a href="/products" className="text-sm text-accent hover:underline">
                View all products →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-6 py-20 text-center text-gray-400">
        Loading products...
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
