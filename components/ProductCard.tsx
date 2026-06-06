import Link from 'next/link';
import type { Product } from '@/types';

function starsHTML(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function avgRating(reviews: Product['reviews']) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'bg-amber-100 text-amber-700',
  'Sale': 'bg-red-100 text-red-600',
  'New': 'bg-green-100 text-green-700',
};

export default function ProductCard({ product, allProducts }: { product: Product; allProducts?: Product[] }) {
  const avg = avgRating(product.reviews);

  // For bundles: compute original total and discounted price from live item prices
  const bundleOriginalTotal = product.isBundle && product.bundleItems?.length && allProducts?.length
    ? product.bundleItems.reduce((s, id) => s + (allProducts.find(p => p.id === id)?.price ?? 0), 0)
    : null;
  const effectiveBundlePrice = bundleOriginalTotal && (product.bundleDiscount ?? 0) > 0
    ? Math.round(bundleOriginalTotal * (1 - (product.bundleDiscount ?? 0) / 100) * 100) / 100
    : null;

  const displayPrice = effectiveBundlePrice ?? product.price;
  const displayOldPrice = bundleOriginalTotal ?? product.oldPrice;
  const savePct = displayOldPrice && displayOldPrice > displayPrice
    ? Math.round((1 - displayPrice / displayOldPrice) * 100)
    : null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-card-hover transition-all duration-200"
    >
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300 transition-transform duration-300 group-hover:scale-105">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5"/>
              <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5"/>
              <path d="m21 15-5-5L5 21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs">{product.name}</span>
          </div>
        )}
        {product.badge && (
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_STYLES[product.badge] ?? 'bg-gray-100 text-gray-600'}`}>
            {product.badge}
          </span>
        )}
        {product.freeShipping && (
          <span className="absolute bottom-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500 text-white">
            Free Shipping
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <span className="text-xs font-medium text-accent">{product.category}</span>
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-accent transition-colors leading-snug">
          {product.name}
        </h3>

        {avg > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm tracking-tight">{starsHTML(avg)}</span>
            <span className="text-xs text-gray-400">({product.reviews.length})</span>
          </div>
        )}

        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{product.shortDesc}</p>

        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-50">
          <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
          {displayOldPrice && displayOldPrice > displayPrice && (
            <span className="text-sm text-gray-400 line-through">${displayOldPrice.toFixed(2)}</span>
          )}
          {savePct && (
            <span className="text-xs font-semibold text-red-500 ml-auto">-{savePct}%</span>
          )}
        </div>

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
