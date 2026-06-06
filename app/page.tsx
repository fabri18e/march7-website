import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { getAllProducts } from '@/lib/products';

// Force dynamic rendering so Supabase data is always fresh (never cached)
export const dynamic = 'force-dynamic';

function CheckBadge({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-900/40"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
        <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

type IconProps = { className?: string; style?: CSSProperties };

function HeadphonesIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 52 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 32V24C6 13.5 15 5 26 5s20 8.5 20 19v8" />
      <rect x="2" y="30" width="9" height="14" rx="3" />
      <rect x="41" y="30" width="9" height="14" rx="3" />
    </svg>
  );
}

function EarbudsIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="22" r="10" />
      <circle cx="30" cy="22" r="10" />
      <path d="M14 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <circle cx="14" cy="22" r="4" fill="currentColor" fillOpacity=".15" />
      <circle cx="30" cy="22" r="4" fill="currentColor" fillOpacity=".15" />
    </svg>
  );
}

function KeyboardIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 72 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="70" height="34" rx="5" />
      {[9, 18, 27, 36, 45, 54, 63].map(x => (
        <circle key={`r1-${x}`} cx={x} cy="11" r="2.5" fill="currentColor" fillOpacity=".4" />
      ))}
      {[9, 18, 27, 36, 45, 54, 63].map(x => (
        <circle key={`r2-${x}`} cx={x} cy="20" r="2.5" fill="currentColor" fillOpacity=".4" />
      ))}
      <rect x="20" y="27" width="32" height="5" rx="2" fill="currentColor" fillOpacity=".3" />
    </svg>
  );
}

function MouseIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 32 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="24" height="40" rx="12" />
      <line x1="16" y1="4" x2="16" y2="22" />
      <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity=".3" />
    </svg>
  );
}

function DroneIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="22" y="18" width="20" height="14" rx="3" />
      <line x1="22" y1="22" x2="8" y2="10" />
      <line x1="42" y1="22" x2="56" y2="10" />
      <line x1="22" y1="30" x2="8" y2="40" />
      <line x1="42" y1="30" x2="56" y2="40" />
      <ellipse cx="8" cy="10" rx="7" ry="4" />
      <ellipse cx="56" cy="10" rx="7" ry="4" />
      <ellipse cx="8" cy="40" rx="7" ry="4" />
      <ellipse cx="56" cy="40" rx="7" ry="4" />
      <circle cx="32" cy="25" r="4" fill="currentColor" fillOpacity=".2" />
    </svg>
  );
}

function USBHubIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="52" height="16" rx="4" />
      {[12, 22, 32, 42, 52].map((x, i) => (
        <rect key={i} x={x - 3} y="18" width="6" height="6" rx="1" fill="currentColor" fillOpacity=".3" />
      ))}
      <rect x="24" y="2" width="12" height="6" rx="2" />
    </svg>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function Home() {
  const products = await getAllProducts();
  const featured = shuffle(products).slice(0, 4);
  const bestSellers = products.filter(p => p.badge === 'Best Seller');
  const newProducts = products.filter(p => p.badge === 'New');

  return (
    <div>
      {/* ── HERO ── */}
      <section
        className="relative text-white overflow-hidden"
        style={{ background: '#070d1a', minHeight: '360px' }}
      >
        {/* Radial green glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(34,197,94,0.07) 0%, transparent 70%)',
        }} />

        {/* Floating decorative elements — hidden on mobile */}
        <div className="absolute animate-float hidden sm:block" style={{ top: '14%', left: '2%', animationDuration: '4s' }}>
          <CheckBadge size={50} />
        </div>
        <div className="absolute animate-float-alt hidden md:block" style={{ top: '6%', left: '42%', animationDuration: '5s', animationDelay: '1.3s' }}>
          <CheckBadge size={36} />
        </div>
        <div className="absolute animate-float hidden md:block" style={{ bottom: '18%', right: '10%', animationDuration: '4.5s', animationDelay: '2.1s' }}>
          <CheckBadge size={32} />
        </div>
        <div className="absolute animate-float-slow hidden lg:block" style={{ top: '38%', right: '2%', animationDuration: '6s', animationDelay: '0.6s' }}>
          <CheckBadge size={42} />
        </div>
        <div className="absolute text-gray-500 font-bold animate-float-alt hidden md:block" style={{ top: '10%', right: '20%', animationDuration: '5s', animationDelay: '1s', fontSize: '22px' }}>✕</div>
        <div className="absolute animate-float hidden lg:block" style={{ top: '5%', right: '6%', animationDuration: '5s', animationDelay: '0.4s' }}>
          <HeadphonesIcon className="text-white/65" style={{ width: 180, height: 160 } as React.CSSProperties} />
        </div>
        <div className="absolute animate-float-slow hidden xl:block" style={{ top: '4%', left: '16%', animationDuration: '6.5s', animationDelay: '1.8s' }}>
          <HeadphonesIcon className="text-white/35" style={{ width: 68, height: 60 } as React.CSSProperties} />
        </div>
        <div className="absolute animate-float-alt hidden lg:block" style={{ bottom: '8%', left: '38%', animationDuration: '7s', animationDelay: '0.9s' }}>
          <KeyboardIcon className="text-white/50" style={{ width: 140, height: 70 } as React.CSSProperties} />
        </div>
        <div className="absolute animate-float hidden md:block" style={{ top: '52%', right: '18%', animationDuration: '4.8s', animationDelay: '2s' }}>
          <EarbudsIcon className="text-white/55" style={{ width: 84, height: 84 } as React.CSSProperties} />
        </div>
        <div className="absolute animate-float-slow hidden xl:block" style={{ bottom: '22%', left: '5%', animationDuration: '5.5s', animationDelay: '1.4s' }}>
          <MouseIcon className="text-white/40" style={{ width: 48, height: 72 } as React.CSSProperties} />
        </div>
        <div className="absolute animate-float-alt hidden xl:block" style={{ bottom: '12%', right: '2%', animationDuration: '6s', animationDelay: '2.7s' }}>
          <DroneIcon className="text-white/40" style={{ width: 100, height: 76 } as React.CSSProperties} />
        </div>
        <div className="absolute animate-float hidden lg:block" style={{ bottom: '14%', left: '20%', animationDuration: '5s', animationDelay: '0.2s' }}>
          <USBHubIcon className="text-white/35" style={{ width: 80, height: 44 } as React.CSSProperties} />
        </div>
        <div className="absolute w-5 h-5 rounded-full bg-green-400/25 animate-float hidden sm:block" style={{ top: '62%', left: '9%', animationDuration: '5.5s', animationDelay: '0.7s' }} />
        <div className="absolute w-3 h-3 rounded-full bg-white/15 animate-float-alt hidden sm:block" style={{ top: '22%', right: '32%', animationDuration: '4.2s', animationDelay: '2.3s' }} />
        <div className="absolute w-4 h-4 rounded-full bg-green-500/20 animate-float-slow hidden sm:block" style={{ bottom: '32%', left: '30%', animationDuration: '6.8s', animationDelay: '1.2s' }} />

        {/* Main content */}
        <div className="relative z-10 px-6 py-12 md:py-20 max-w-6xl mx-auto">
          <div className="max-w-lg">
            <div className="animate-hero-in inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-4" style={{ animationDelay: '0.05s' }}>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Every product personally tested &amp; verified
            </div>
            <h1 className="animate-hero-in text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4" style={{ animationDelay: '0.15s' }}>
              Factory-Direct Tech.<br />
              <span className="text-gray-400">No Overpriced Brands.</span>
            </h1>
            <p className="animate-hero-in text-gray-400 text-sm sm:text-base max-w-md leading-relaxed mb-6" style={{ animationDelay: '0.27s' }}>
              We filter out the trash. Only products that pass our strict quality tests make the cut.
            </p>
            <div className="animate-hero-in flex flex-wrap items-center gap-3" style={{ animationDelay: '0.38s' }}>
              <Link
                href="/products"
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-3 rounded-xl transition-colors text-sm sm:text-base"
              >
                Browse Products
              </Link>
              <Link
                href="/products"
                className="text-gray-400 hover:text-white font-medium px-2 py-3 transition-colors text-sm"
              >
                View all →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            {[
              { icon: '🛡️', title: 'Quality Tested', desc: 'Every product verified' },
              { icon: '🚚', title: 'Fast Shipping', desc: 'Delivers in 7–15 days' },
              { icon: '↩', title: '30-Day Returns', desc: 'According to our policy' },
              { icon: '🔒', title: 'Secure Payment', desc: 'SSL encrypted' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-4 sm:py-5">
                <span className="text-xl sm:text-2xl">{item.icon}</span>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 hidden sm:block">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 mt-1 text-sm">Hand-picked for quality and value</p>
            </div>
            <Link href="/products" className="text-sm text-accent hover:text-accent-hover font-medium whitespace-nowrap ml-4">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {featured.map(p => <ProductCard key={p.id} product={p} allProducts={products} />)}
          </div>
        </section>
      )}

      {/* ── Best Sellers ── */}
      {bestSellers.length > 0 && (
        <section className="bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Best Sellers</h2>
                <p className="text-gray-500 mt-1 text-sm">Most popular with our customers</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {bestSellers.map(p => <ProductCard key={p.id} product={p} allProducts={products} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── New Arrivals ── */}
      {newProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">New Arrivals</h2>
              <p className="text-gray-500 mt-1 text-sm">Just added to the catalog</p>
            </div>
            <Link href="/products?badge=New" className="text-sm text-accent hover:text-accent-hover font-medium whitespace-nowrap ml-4">
              See all new →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {newProducts.map(p => <ProductCard key={p.id} product={p} allProducts={products} />)}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="bg-gray-950 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to upgrade your setup?
          </h2>
          <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
            Browse our full catalog. Use the AI analyzer on any product to get honest pros and cons.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-colors text-sm sm:text-base"
          >
            Shop All Products →
          </Link>
        </div>
      </section>
    </div>
  );
}
