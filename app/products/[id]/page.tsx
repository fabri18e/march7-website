'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import ReviewSection from '@/components/ReviewSection';
import AIAnalysis from '@/components/AIAnalysis';
import StarRating from '@/components/StarRating';

function avgRating(reviews: Product['reviews']) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

type Tab = 'description' | 'specs' | 'ai';

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { addItem, openCart } = useCart();
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [selectedImage, setSelectedImage] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => {
        const products: Product[] = d.products ?? [];
        setAllProducts(products);
        setProduct(products.find(p => p.id === id) ?? null);
      });
  }, [id]);

  useEffect(() => {
    if (searchParams.get('review') === 'true' && product) {
      setTimeout(() => {
        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [searchParams, product]);

  if (product === undefined) return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-gray-400">Loading...</div>;
  if (product === null) return notFound();

  const allImages = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const currentImage = allImages[selectedImage] ?? null;
  const avg = avgRating(product.reviews);
  const savePct = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
  };

  const handleBuyNow = () => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    openCart();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'specs', label: 'Specifications' },
    { key: 'ai', label: '🤖 AI Analysis' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
        {/* Image gallery — thumbnails left, main image right (Amazon/AliExpress style) */}
        <div className="flex gap-3">
          {/* Vertical thumbnail strip — only visible when 2+ images, hidden on mobile */}
          {allImages.length > 1 && (
            <div className="hidden sm:flex flex-col gap-2 w-[72px] flex-shrink-0 overflow-y-auto max-h-[500px]">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-[68px] h-[68px] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i
                      ? 'border-accent shadow-sm'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div className="flex-1 min-w-0">
            <div className="aspect-square bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 overflow-hidden">
              {currentImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-300">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1"/>
                    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1"/>
                    <path d="m21 15-5-5L5 21" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm">{product.name}</span>
                </div>
              )}
            </div>

            {/* Mobile: horizontal thumbnails below the image */}
            {allImages.length > 1 && (
              <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-accent' : 'border-gray-200'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
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
            <span className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.oldPrice && (
              <span className="text-xl text-gray-400 line-through mb-1">${product.oldPrice.toFixed(2)}</span>
            )}
            {savePct && (
              <span className="text-sm font-bold text-red-500 mb-1 bg-red-50 px-2 py-0.5 rounded-lg">
                Save {savePct}%
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

          <p className="text-gray-600 leading-relaxed">{product.shortDesc}</p>

          {product.features.length > 0 && (
            <ul className="space-y-2">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3.5 px-6 rounded-xl transition-colors"
            >
              ⚡ Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 border-2 border-accent text-accent hover:bg-accent-light font-semibold py-3.5 px-6 rounded-xl transition-colors"
            >
              🛒 Add to Cart
            </button>
          </div>

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

      {/* Tabs: Description / Specs / AI */}
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

      {/* Reviews — always visible, never hidden in a tab */}
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
          autoOpenForm={searchParams.get('review') === 'true'}
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
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                    📦
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
  );
}
