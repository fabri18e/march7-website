'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import SearchBar from './SearchBar';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { count, openCart } = useCart();
  const { user, loading, signOut, isAdmin } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const navLink = 'flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors';

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gray-950 text-gray-300 text-xs text-center py-2 px-4">
        🚚 Free shipping over $50 &nbsp;·&nbsp; ✓ Quality Verified &nbsp;·&nbsp; ↩ 30-Day Returns &nbsp;·&nbsp; 🔒 Secure Checkout
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

          {/* Hamburger drawer button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2.5" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <span className="text-xs font-semibold hidden sm:inline">All</span>
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image
              src="/images/logo.png"
              alt="March7"
              width={500}
              height={160}
              className="h-12 sm:h-14 w-auto"
              priority
            />
          </Link>

          {/* Search — center, hidden on mobile */}
          <div className="flex-1 hidden md:flex justify-center px-4">
            <SearchBar />
          </div>

          {/* Right nav */}
          <nav className="flex items-center gap-1 ml-auto">

            {/* Products link — desktop only */}
            <Link
              href="/products"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Products
            </Link>

            {/* Account dropdown */}
            {!loading && (
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                  aria-label="Account"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                  </svg>
                  <span className="hidden sm:inline text-sm">
                    {user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Account') : 'Sign In'}
                  </span>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-dropdown py-1 z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-50">
                          <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p>
                        </div>
                        <Link href="/account" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="1.5" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                          </svg>
                          My Account
                        </Link>
                        {isAdmin && (
                          <Link href="/admin" onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                            Admin Panel
                          </Link>
                        )}
                        <button onClick={() => { signOut(); setAccountOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="1.5" strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                          </svg>
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent-light transition-colors">
                          Sign In
                        </Link>
                        <Link href="/auth?tab=register" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="8" cy="21" r="1" strokeWidth="2"/>
                <circle cx="19" cy="21" r="1" strokeWidth="2"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {count > 9 ? '9+' : count}
                </span>
              )}
              <span className="hidden sm:inline">Cart</span>
            </button>
          </nav>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </header>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-900">
          <Link href="/" onClick={() => setDrawerOpen(false)}>
            <Image src="/images/logo.png" alt="March7" width={300} height={96} className="h-8 w-auto brightness-200" />
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">

          {/* Home */}
          <Link href="/" className={navLink}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
              <path strokeWidth="1.5" d="M9 21V12h6v9"/>
            </svg>
            Home
          </Link>

          {/* All Products */}
          <Link href="/products" className={navLink}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/>
            </svg>
            All Products
          </Link>

          {/* Categories */}
          <div className="pt-2 pb-1 px-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</p>
          </div>
          {['Audio', 'Gaming', 'Peripherals', 'Accessories', 'Networking', 'Storage'].map(cat => (
            <Link key={cat} href={`/products?category=${cat}`} className={navLink}>
              <span className="w-4 h-4 flex-shrink-0" />
              {cat}
            </Link>
          ))}

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-4 my-2" />

          {/* Track Order */}
          <Link href="/track" className={navLink}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            Track My Order
          </Link>

          {/* FAQ */}
          <Link href="/legal/faq" className={navLink}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="17" r=".5" fill="currentColor"/>
            </svg>
            FAQ
          </Link>

          {/* Contact */}
          <Link href="/legal/contact" className={navLink}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Contact
          </Link>

          {/* Returns */}
          <Link href="/legal/returns" className={navLink}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
            Returns & Refunds
          </Link>

          {/* Shipping */}
          <Link href="/legal/shipping" className={navLink}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5" strokeWidth="1.5"/>
              <circle cx="18.5" cy="18.5" r="2.5" strokeWidth="1.5"/>
            </svg>
            Shipping Info
          </Link>
        </div>

        {/* Account section at bottom */}
        <div className="border-t border-gray-100 p-3">
          {!loading && (
            user ? (
              <div className="space-y-0.5">
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                </div>
                <Link href="/account" className={navLink}>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.5" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="1.5"/>
                  </svg>
                  My Account
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={navLink}>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setDrawerOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.5" strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                <Link href="/auth" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent-light rounded-xl transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.5" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="1.5"/>
                  </svg>
                  Sign In
                </Link>
                <Link href="/auth?tab=register" className={navLink}>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.5" strokeLinecap="round" d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4" strokeWidth="1.5"/>
                    <path strokeWidth="1.5" strokeLinecap="round" d="M20 8v6m3-3h-6"/>
                  </svg>
                  Create Account
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
