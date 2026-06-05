'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { Product } from '@/types';

interface FiltersProps {
  products: Product[];
  activeCategory: string;
  activeTag: string;
  activeFreeShipping?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export default function Filters({ products, activeCategory, activeTag, activeFreeShipping }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Clear conflicting params
    if (key === 'category') params.delete('tag');
    if (key === 'tag') params.delete('category');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const allTags = [...new Set(products.flatMap(p => p.tags))].sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Category</h3>
        <div className="flex flex-col gap-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => updateFilter('category', cat === 'All' ? '' : cat)}
              className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                (cat === 'All' && !activeCategory) || activeCategory === cat
                  ? 'bg-accent-light text-accent font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tags</h3>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => updateFilter('tag', activeTag === tag ? '' : tag)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeTag === tag
                  ? 'bg-accent text-white font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Shipping</h3>
        <button
          onClick={() => updateFilter('freeShipping', activeFreeShipping ? '' : '1')}
          className={`text-left w-full px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${
            activeFreeShipping
              ? 'bg-green-50 text-green-700 font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span>🚚</span> Free Shipping
        </button>
      </div>
    </div>
  );
}
