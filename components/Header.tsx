'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import SearchBar from './SearchBar';

export default function Header() {
  const { count, openCart } = useCart();
  const { user, loading, signOut, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <div className="bg-gray-950 text-gray-300 text-xs text-center py-2 px-4">
        🚚 Free shipping over $50 &nbsp;·&nbsp; ✓ Quality Verified &nbsp;·&nbsp; ↩ 30-Day Returns &nbsp;·&nbsp; 🔒 Secure Checkout
      </div>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 flex-shrink-0">
            March7
          </Link>

          <div className="flex-1 hidden sm:flex justify-center px-4">
            <SearchBar />
          </div>

          <nav className="flex items-center gap-1 flex-shrink-0">
            <Link
              href="/products"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Products
            </Link>

            {/* Account menu */}
            {!loading && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                  </svg>
                  <span className="hidden sm:inline">
                    {user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Account') : 'Sign In'}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-dropdown py-1 z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-50">
                          <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/account"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="1.5" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                          </svg>
                          My Account
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => { signOut(); setMenuOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="1.5" strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                          </svg>
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent-light transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth?tab=register"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
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
              className="relative flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="8" cy="21" r="1" strokeWidth="2"/>
                <circle cx="19" cy="21" r="1" strokeWidth="2"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
              <span className="hidden sm:inline">Cart</span>
            </button>
          </nav>
        </div>

        <div className="sm:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </header>
    </>
  );
}
