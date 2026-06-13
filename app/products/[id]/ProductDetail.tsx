'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ReviewSection from '@/components/ReviewSection';
import AIAnalysis from '@/components/AIAnalysis';
import StarRating from '@/components/StarRating';
import { tiktokViewContent, tiktokAddToCart } from '@/lib/tiktok';
import { avgRating } from '@/lib/utils';

type Tab = 'description' | 'specs' | 'ai';

function ProductDetailInner({ product, allProducts, autoOpenReview }: { product: Product; allProducts: Product[]; autoOpenReview?: boolean }) {
  const { addItem, openCart } = useCart();
  const { user } = useAuth();
  const [buyLoading, setBuyLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dx > dy) e.preventDefault();
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) setSelectedImage(i => (i + 1) % allImages.length);
    else setSelectedImage(i => (i - 1 + allImages.length) % allImages.length);
  };

  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [bundleVariants, setBundleVariants] = useState<Record<string, number | null>>({});
  useEffect(() => {
    tiktokViewContent(product.id, product.name, product.price);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => { setSelectedImage(0); setImgError(false); }, [selectedVariant]);
  useEffect(() => { setImgError(false); }, [selectedImage]);

  const variants = product.variants?.filter(v => v.color) ?? [];
  const activeVariant = selectedVariant !== null ? variants[selectedVariant] : null;
  const baseImages = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const allImages = (activeVariant?.images?.length ? activeVariant.images : null) ?? baseImages;
  const currentImage = allImages[selectedImage] ?? null;
  const avg = avgRating(product.reviews);

  const displayPrice = activeVariant?.price ?? product.price;
  const displayOldPrice = activeVariant?.oldPrice ?? (activeVariant?.price ? null : product.oldPrice);
  const savePct = displayOldPrice && displayOldPrice > displayPrice
    ? Math.round((1 - displayPrice / displayOldPrice) * 100)
    : null;

  // Bundle page: dynamically recalculate price based on selected variant per item
  const bundlePageItems: Product[] = product.isBundle
    ? (product.bundleItems || []).map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[]
    : [];
  const bundlePageItemTotal = bundlePageItems.reduce((s, p) => {
    const vi = bundleVariants[p.id] ?? null;
    return s + (vi !== null ? (p.variants?.[vi]?.price ?? p.price) : p.price);
  }, 0);
  const effectivePrice = product.isBundle && bundlePageItems.length > 0
    ? Math.round(bundlePageItemTotal * (1 - (product.bundleDiscount ?? 0) / 100) * 100) / 100
    : displayPrice;
  const effectiveOldPrice = product.isBundle && bundlePageItems.length > 0
    ? bundlePageItemTotal
    : displayOldPrice;
  const effectiveSavePct = product.isBundle && bundlePageItems.length > 0 && (product.bundleDiscount ?? 0) > 0
    ? product.bundleDiscount ?? 0
    : savePct;

  // For bundle page: build color summary from selected variants across all included items
  const bundlePageColorSummary = product.isBundle
    ? bundlePageItems
        .filter(p => (p.variants?.filter(v => v.color) ?? []).length > 0)
        .map(p => {
          const vi = bundleVariants[p.id] ?? null;
          const colorName = vi !== null
            ? (p.variants ?? [])[vi]?.color
            : (p.defaultColorLabel || 'Default');
          return `${p.name.split(' ')[0]}: ${colorName}`;
        })
    : [];

  const cartId = product.isBundle
    ? `${product.id}--${bundlePageColorSummary.join('|').toLowerCase().replace(/\s+/g, '-') || 'default'}`
    : activeVariant
      ? `${product.id}--${activeVariant.color.toLowerCase().replace(/\s+/g, '-')}`
      : product.id;
  const cartName = product.isBundle
    ? `🎁 ${product.name}${bundlePageColorSummary.length ? ` (${bundlePageColorSummary.join(', ')})` : ''}`
    : activeVariant ? `${product.name} — ${activeVariant.color}` : product.name;
  const cartImage = activeVariant?.images?.[0] ?? product.image;

  const handleAddToCart = () => {
    addItem({ id: cartId, name: cartName, price: effectivePrice, image: cartImage });
    tiktokAddToCart(product.id, cartName, effectivePrice);
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'add_to_cart', {
        currency: 'USD', value: effectivePrice,
        items: [{ item_id: product.id, item_name: cartName, price: effectivePrice, quantity: 1 }],
      });
    }
  };

  const handlePayPal = async () => {
    setPaypalLoading(true);
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: cartId, qty: 1, image: cartImage }],
          userId: user?.id || '',
          userEmail: user?.email || '',
        }),
      });
      const data = await res.json();
      if (data.approveUrl) window.location.href = data.approveUrl;
      else throw new Error(data.error || 'PayPal error');
    } catch {
      setPaypalLoading(false);
    }
  };

  const handleBuyNow = async () => {
    tiktokAddToCart(product.id, cartName, effectivePrice);
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'begin_checkout', {
        currency: 'USD', value: effectivePrice,
        items: [{ item_id: product.id, item_name: cartName, price: effectivePrice, quantity: 1 }],
      });
    }
    setBuyLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: cartId, qty: 1, image: cartImage }],
          userId: user?.id || '',
          userEmail: user?.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch {
      setBuyLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'specs', label: 'Specifications' },
    { key: 'ai', label: '✅ Expert Review' },
  ];

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
        <span>›</span>
        <Link href="/products" className="hover:text-gray-600 transition-colors">Products</Link>
        <span>›</span>
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
          className="hover:text-gray-600 transition-colors"
        >
          {product.category}
        </Link>
        <span>›</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product main */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-14">
        {/* Image gallery */}
        <div className="flex gap-3">
          {allImages.length > 1 && (
            <div className="hidden sm:flex flex-col gap-2 w-[72px] flex-shrink-0 overflow-y-auto max-h-[500px] scrollbar-hide">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-[68px] h-[68px] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-accent shadow-sm' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image src={img} alt="" fill sizes="68px" className="object-cover" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div ref={imageContainerRef} className="relative aspect-square bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {allImages.length > 0 && !imgError ? (
                <div
                  className="flex h-full transition-transform duration-300 ease-in-out"
                  style={{ width: `${allImages.length * 100}%`, transform: `translateX(-${selectedImage * (100 / allImages.length)}%)` }}
                >
                  {allImages.map((img, i) => (
                    <div key={img + i} className="relative h-full" style={{ width: `${100 / allImages.length}%` }}>
                      <Image src={img} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority={i === 0} onError={() => { if (i === selectedImage) setImgError(true); }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-300">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1"/>
                    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1"/>
                    <path d="m21 15-5-5L5 21" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm">{product.name}</span>
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-accent' : 'border-gray-200'
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <span className="text-green-500">✓</span> Quality Verified by March7
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-accent bg-accent-light px-2.5 py-1 rounded-full">
                {product.category}
              </span>
              {product.badge && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  product.badge === 'Best Seller' ? 'bg-amber-100 text-amber-700' :
                  product.badge === 'Sale' ? 'bg-red-100 text-red-600' :
                  'bg-green-100 text-green-700'
                }`}>
                  {product.badge}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {avg > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(avg)} readonly />
              <span className="text-sm font-medium text-gray-700">{avg.toFixed(1)}</span>
              <a href="#reviews" className="text-sm text-accent hover:underline">
                ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})
              </a>
            </div>
          )}


          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-gray-900">${effectivePrice.toFixed(2)}</span>
            {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
              <span className="text-xl text-gray-400 line-through mb-1">${effectiveOldPrice.toFixed(2)}</span>
            )}
            {effectiveSavePct && (
              <span className="text-sm font-bold text-red-500 mb-1 bg-red-50 px-2 py-0.5 rounded-lg">
                Save {effectiveSavePct}%
              </span>
            )}
          </div>

          {product.freeShipping && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8l4 4v3M13 17h8m-4-4 4 4-4 4"/>
                <circle cx="7.5" cy="17.5" r="1.5" strokeWidth="1.5"/>
                <circle cx="17.5" cy="17.5" r="1.5" strokeWidth="1.5"/>
              </svg>
              <div>
                <p className="text-sm font-bold text-green-700">Free Shipping</p>
                <p className="text-xs text-green-600">Included with your order — no extra cost</p>
              </div>
            </div>
          )}

          {variants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3">
                Color: <span className="text-gray-900 font-bold">
                  {selectedVariant !== null ? variants[selectedVariant].color : 'Default'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Default swatch */}
                {(() => {
                  const defaultThumb = baseImages[0] ?? null;
                  return (
                    <button
                      onClick={() => setSelectedVariant(null)}
                      className={`flex flex-col items-center gap-1 group transition-all`}
                    >
                      <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedVariant === null ? 'border-accent shadow-sm' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                        {defaultThumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={defaultThumb} alt={product.defaultColorLabel || 'Default'} className="w-full h-full object-cover" />
                        ) : product.defaultColorHex ? (
                          <div className="w-full h-full" style={{ backgroundColor: product.defaultColorHex }} />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs">–</div>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${selectedVariant === null ? 'text-accent' : 'text-gray-500'}`}>
                        {product.defaultColorLabel || 'Default'}
                      </span>
                    </button>
                  );
                })()}

                {/* Variant swatches */}
                {variants.map((v, i) => {
                  const thumb = v.images?.[0] ?? null;
                  const active = selectedVariant === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(i)}
                      className="flex flex-col items-center gap-1 group transition-all"
                    >
                      <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        active ? 'border-accent shadow-sm' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={v.color} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: v.hex || '#e5e7eb' }}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${active ? 'text-accent' : 'text-gray-500'}`}>
                        {v.color}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.isBundle && bundlePageItems.length > 0 && (
            <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">What's included</p>
                {(product.bundleDiscount ?? 0) > 0 && (
                  <span className="text-xs font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
                    {product.bundleDiscount}% off
                  </span>
                )}
              </div>
              {bundlePageItems.map(p => {
                const itemVariants = (p.variants ?? []).filter(v => v.color);
                const vi = bundleVariants[p.id] ?? null;
                const thumb = vi !== null ? (p.variants?.[vi]?.images?.[0] ?? p.image) : p.image;
                const itemPrice = vi !== null ? (p.variants?.[vi]?.price ?? p.price) : p.price;
                return (
                  <div key={p.id} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-amber-100 flex-shrink-0">
                      {thumb
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">${itemPrice.toFixed(2)} individually</p>
                      {itemVariants.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                          <button
                            onClick={() => setBundleVariants(s => ({ ...s, [p.id]: null }))}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-all ${vi === null ? 'border-accent text-accent bg-white font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                          >
                            {p.defaultColorLabel || 'Default'}
                          </button>
                          {itemVariants.map((v) => {
                            const fullIdx = (p.variants ?? []).indexOf(v);
                            return (
                              <button
                                key={fullIdx}
                                onClick={() => setBundleVariants(s => ({ ...s, [p.id]: fullIdx }))}
                                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${vi === fullIdx ? 'border-accent text-accent bg-white font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                              >
                                {v.hex && (
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-full mr-1 -mb-px border border-gray-200"
                                    style={{ backgroundColor: v.hex }}
                                  />
                                )}
                                {v.color}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                <span className="text-sm text-gray-400 line-through">${bundlePageItemTotal.toFixed(2)}</span>
                <span className="text-base font-bold text-gray-900">${effectivePrice.toFixed(2)}</span>
                {(product.bundleDiscount ?? 0) > 0 && (
                  <span className="text-xs text-green-600 font-semibold">
                    Save ${(bundlePageItemTotal - effectivePrice).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={handleBuyNow}
              disabled={buyLoading}
              className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-70"
            >
              {buyLoading ? 'Redirecting...' : 'Buy Now'}
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 border-2 border-accent text-accent hover:bg-accent-light font-semibold py-3.5 px-6 rounded-xl transition-colors"
            >
              🛒 Add to Cart
            </button>
          </div>
          {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
            <button
              onClick={handlePayPal}
              disabled={paypalLoading}
              className="w-full bg-[#FFC439] hover:bg-[#f0b429] disabled:opacity-50 text-[#003087] font-bold py-3.5 px-6 rounded-xl transition-colors"
            >
              {paypalLoading ? '...' : <span>Pay<span className="font-light">Pal</span></span>}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-gray-500">
            {[
              ['🚚', product.freeShipping ? 'Free Shipping' : 'Delivery in 7–15 business days'],
              ['↩', '30-day returns'],
              ['🛡️', 'Quality verified'],
              ['🔒', 'Secure checkout'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-1.5">
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>

          <p className="text-gray-600 leading-relaxed">{product.shortDesc}</p>

          {product.features.length > 0 && (
            <div>
              <ul className="space-y-2">
                {(showAllFeatures ? product.features : product.features.slice(0, 3)).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {product.features.length > 3 && (
                <button
                  onClick={() => setShowAllFeatures(s => !s)}
                  className="mt-2 text-xs text-accent hover:underline font-medium flex items-center gap-1"
                >
                  {showAllFeatures ? 'Show less ▲' : `Show ${product.features.length - 3} more ▼`}
                </button>
              )}
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
              {product.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/products?tag=${encodeURIComponent(tag)}`}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bundle section — full width, prominent */}
      {(() => {
        const bundles = allProducts.filter(p => p.isBundle && p.bundleItems?.includes(product.id));
        if (!bundles.length) return null;
        return (
          <div className="mb-10 space-y-5">
            {bundles.map(bundle => {
              const items = (bundle.bundleItems || [])
                .map(id => allProducts.find(p => p.id === id))
                .filter(Boolean) as typeof allProducts;
              if (!items.length) return null;

              // Dynamic pricing: sum variant prices if selected, else base price
              const itemTotal = items.reduce((s, p) => {
                const vi = bundleVariants[p.id] ?? null;
                const variantPrice = vi !== null ? (p.variants?.[vi]?.price ?? p.price) : p.price;
                return s + variantPrice;
              }, 0);
              const discountPct = bundle.bundleDiscount ?? 0;
              const bundlePrice = Math.round(itemTotal * (1 - discountPct / 100) * 100) / 100;
              const savePct = discountPct > 0 ? discountPct : 0;

              const colorSummary = items
                .filter(p => (p.variants?.filter(v => v.color) ?? []).length > 0)
                .map(p => {
                  const vi = bundleVariants[p.id] ?? null;
                  const colorName = vi !== null
                    ? (p.variants ?? [])[vi]?.color
                    : (p.defaultColorLabel || 'Default');
                  return `${p.name.split(' ')[0]}: ${colorName}`;
                });

              return (
                <div key={bundle.id} className="border-2 border-amber-200 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎁</span>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{bundle.name}</p>
                        <p className="text-xs text-gray-500">{bundle.shortDesc}</p>
                      </div>
                    </div>
                    {savePct > 0 && (
                      <span className="text-sm font-bold text-white bg-green-500 px-3 py-1 rounded-full">
                        Save {savePct}%
                      </span>
                    )}
                  </div>

                  {/* Products */}
                  <div className="px-6 py-5">
                    <div className="flex flex-wrap gap-4 items-start justify-center sm:justify-start">
                      {items.map((p, pi) => {
                        const variantIndex = bundleVariants[p.id] ?? null;
                        const activeVariant = variantIndex !== null ? (p.variants ?? [])[variantIndex] : null;
                        const thumb = activeVariant?.images?.[0] ?? p.image ?? null;
                        const itemVariants = (p.variants ?? []).filter(v => v.color);
                        return (
                          <div key={p.id} className="flex items-center gap-3">
                            {pi > 0 && <span className="text-2xl font-light text-gray-300 hidden sm:block">+</span>}
                            <div className="flex flex-col items-center gap-1.5 w-28">
                              {/* Image */}
                              <Link href={`/products/${p.id}`} className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 block hover:opacity-80 transition-opacity">
                                {thumb
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                                }
                              </Link>
                              {/* Name + price */}
                              <p className="text-xs font-semibold text-gray-800 text-center line-clamp-2 leading-tight">{p.name.split(',')[0]}</p>
                              <p className="text-xs text-gray-400">
                                ${((variantIndex !== null ? (p.variants?.[variantIndex]?.price ?? p.price) : p.price)).toFixed(2)}
                              </p>
                              {/* Color swatches if variants exist */}
                              {itemVariants.length > 0 && (
                                <div className="flex flex-wrap gap-1 justify-center">
                                  <button
                                    onClick={() => setBundleVariants(s => ({ ...s, [p.id]: null }))}
                                    className={`w-5 h-5 rounded-full border-2 transition-all bg-gray-200 ${variantIndex === null ? 'border-accent scale-110' : 'border-transparent hover:border-gray-400'}`}
                                    title={p.defaultColorLabel || 'Default'}
                                  />
                                  {itemVariants.map((v) => {
                                    const fullIdx = (p.variants ?? []).indexOf(v);
                                    return (
                                      <button
                                        key={fullIdx}
                                        onClick={() => setBundleVariants(s => ({ ...s, [p.id]: fullIdx }))}
                                        className={`w-5 h-5 rounded-full border-2 transition-all ${variantIndex === fullIdx ? 'border-accent scale-110' : 'border-transparent hover:border-gray-400'}`}
                                        style={{ backgroundColor: v.hex || '#e5e7eb' }}
                                        title={v.color}
                                      />
                                    );
                                  })}
                                </div>
                              )}
                              {/* Selected color label */}
                              {itemVariants.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  {variantIndex !== null
                                    ? (p.variants ?? [])[variantIndex]?.color
                                    : (p.defaultColorLabel || 'Default')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Price + CTA */}
                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-amber-100">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg text-gray-400 line-through">${itemTotal.toFixed(2)}</span>
                        <span className="text-3xl font-bold text-gray-900">${bundlePrice.toFixed(2)}</span>
                        {savePct > 0 && (
                          <span className="text-sm text-green-600 font-semibold">
                            You save ${(itemTotal - bundlePrice).toFixed(2)} ({savePct}% off)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const colorNote = colorSummary.length ? ` (${colorSummary.join(', ')})` : '';
                          addItem({
                            id: `${bundle.id}--${Object.values(bundleVariants).join('-')}`,
                            name: `🎁 ${bundle.name}${colorNote}`,
                            price: bundlePrice,
                            image: bundle.image,
                          });
                          openCart();
                        }}
                        className="sm:ml-auto bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-8 rounded-xl transition-colors text-sm"
                      >
                        🎁 Add Bundle — ${bundlePrice.toFixed(2)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="border-t border-gray-100 pt-10 mb-16">
        <div className="flex gap-1 mb-8 border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="max-w-2xl">
            <p className="text-gray-700 leading-relaxed text-base">{product.description}</p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="max-w-2xl">
            {product.specs.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {product.specs.map(([label, value], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-3 px-4 font-medium text-gray-700 w-1/3 rounded-l-xl">{label}</td>
                      <td className="py-3 px-4 text-gray-600 rounded-r-xl">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No specifications listed.</p>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <AIAnalysis product={product} />
        )}
      </div>

      {/* Reviews */}
      <section id="reviews" className="border-t border-gray-100 pt-10 mb-16">
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {product.reviews.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-2.5 py-1 rounded-full">
              {product.reviews.length}
            </span>
          )}
        </div>
        <ReviewSection
          productId={product.id}
          staticReviews={product.reviews}
          autoOpenForm={autoOpenReview}
        />
      </section>

      {/* Related products */}
      {(() => {
        const related = allProducts
          .filter(p => p.id !== product.id && p.category === product.category)
          .slice(0, 3);
        if (!related.length) return null;
        return (
          <div className="border-t border-gray-100 pt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">More in {product.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(p => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group flex items-center gap-3 p-3 border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-card transition-all"
                >
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 group-hover:text-accent transition-colors line-clamp-2">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-500">${p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}
    </div>

      {/* Sticky buy bar — mobile & tablet only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{product.name}</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">${effectivePrice.toFixed(2)}</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="border-2 border-accent text-accent hover:bg-accent-light font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          🛒 Cart
        </button>
        <button
          onClick={handleBuyNow}
          disabled={buyLoading}
          className="bg-accent hover:bg-accent-hover text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm whitespace-nowrap disabled:opacity-70"
        >
          {buyLoading ? '...' : 'Buy Now'}
        </button>
      </div>
    </>
  );
}

function ReviewAutoScroll({ productId, product, allProducts }: { productId: string; product: Product; allProducts: Product[] }) {
  const searchParams = useSearchParams();
  const autoOpen = searchParams.get('review') === 'true';

  useEffect(() => {
    if (autoOpen) {
      setTimeout(() => {
        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [autoOpen]);

  return <ProductDetailInner product={product} allProducts={allProducts} autoOpenReview={autoOpen} />;
}

export default function ProductDetail({ product, allProducts }: { product: Product; allProducts: Product[] }) {
  return (
    <Suspense fallback={<ProductDetailInner product={product} allProducts={allProducts} />}>
      <ReviewAutoScroll productId={product.id} product={product} allProducts={allProducts} />
    </Suspense>
  );
}
