'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { tiktokInitiateCheckout, tiktokAddToCart } from '@/lib/tiktok';

interface Suggestion { id: string; name: string; price: number; image: string | null; }

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total, count, addItem } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    fetch('/api/products')
      .then(r => r.json())
      .then(({ products }) => {
        const cartIds = new Set(items.map(i => i.id.split('--')[0]));
        const filtered = (products as Suggestion[]).filter(p => !cartIds.has(p.id));
        // Shuffle deterministically based on cart content
        const seed = items.reduce((a, i) => a + i.id.charCodeAt(0), 0);
        const shuffled = [...filtered].sort((a, b) => (a.id.charCodeAt(0) + seed) % 7 - (b.id.charCodeAt(0) + seed) % 7);
        setSuggestions(shuffled.slice(0, 2));
      })
      .catch(() => {});
  }, [isOpen, items]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleCheckout = async () => {
    tiktokInitiateCheckout(total, items.map(i => ({ id: i.id, name: i.name })));
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          userId: user?.id || '',
          userEmail: user?.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url; // redirect to Stripe
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Your Cart</h2>
            {count > 0 && <p className="text-xs text-gray-400">{count} item{count !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={closeCart} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="8" cy="21" r="1" strokeWidth="2"/>
                  <circle cx="19" cy="21" r="1" strokeWidth="2"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-700">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
              </div>
              <button onClick={closeCart} className="mt-2 text-sm text-accent hover:underline">
                Continue shopping →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl"/>
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-l-lg transition-colors"
                        >−</button>
                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-r-lg transition-colors"
                        >+</button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {suggestions.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">You might also like</p>
                  <div className="space-y-3">
                    {suggestions.map(s => (
                      <div key={s.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden">
                          {s.image
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                            : <span className="flex items-center justify-center w-full h-full text-gray-300 text-xl">📦</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{s.name}</p>
                          <p className="text-xs text-gray-500">${s.price.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => { addItem({ id: s.id, name: s.name, price: s.price, image: s.image }); tiktokAddToCart(s.id, s.name, s.price); }}
                          className="text-xs font-semibold text-accent border border-accent px-2.5 py-1 rounded-lg hover:bg-accent-light transition-colors flex-shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-900 text-lg">${total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400">Taxes and shipping calculated at checkout</p>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <p className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 014-4z"/>
              </svg>
              Have a promo code? Enter it at checkout.
            </p>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                  Redirecting to Stripe...
                </>
              ) : (
                <>💳 Pay with Card · ${total.toFixed(2)}</>
              )}
            </button>

            {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
              <button
                disabled={paypalLoading}
                onClick={async () => {
                  setPaypalLoading(true);
                  setError('');
                  try {
                    const res = await fetch('/api/paypal/create-order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items, userId: user?.id || '', userEmail: user?.email || '' }),
                    });
                    const data = await res.json();
                    if (data.approveUrl) window.location.href = data.approveUrl;
                    else throw new Error(data.error || 'PayPal error');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'PayPal error');
                    setPaypalLoading(false);
                  }
                }}
                className="w-full bg-[#FFC439] hover:bg-[#f0b429] disabled:opacity-50 disabled:cursor-not-allowed text-[#003087] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {paypalLoading ? (
                  <div className="w-4 h-4 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin"/>
                ) : (
                  <span>Pay<span className="font-light">Pal</span> · ${total.toFixed(2)}</span>
                )}
              </button>
            )}

            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Secure checkout · SSL encrypted
            </p>
          </div>
        )}
      </div>
    </>
  );
}
