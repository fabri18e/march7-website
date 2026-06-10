'use client';

import { useEffect, useRef, useState } from 'react';
import { PageLoader } from '@/components/Spinner';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { tiktokPurchase } from '@/lib/tiktok';
import { Suspense } from 'react';

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const saved = useRef(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    // Clear cart directly from localStorage — works regardless of when items load
    clearCart();

    // Save order to Supabase — only once per session_id, even across page reloads
    const storageKey = `m7_saved_${sessionId}`;
    if (sessionId && !saved.current && !sessionStorage.getItem(storageKey)) {
      saved.current = true;
      sessionStorage.setItem(storageKey, '1');
      fetch('/api/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) setSaveError(data.error);
          else {
            const amount = data.totalAmount ? data.totalAmount / 100 : 0;
            const items = (data.orderItems || []).map((i: { product_id: string | null; name: string; quantity: number }) => ({
              id: i.product_id ?? '',
              name: i.name,
              quantity: i.quantity,
            }));
            tiktokPurchase(amount, items);
            if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
              (window as any).gtag('event', 'purchase', {
                transaction_id: sessionId,
                value: amount,
                currency: 'USD',
                items: items.map((i: { id: string; name: string; quantity: number }) => ({ item_id: i.id, item_name: i.name, quantity: i.quantity })),
              });
              (window as any).gtag('event', 'conversion_event_purchase', {
                transaction_id: sessionId,
                value: amount,
                currency: 'USD',
              });
            }
          }
        })
        .catch(err => setSaveError(err.message));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
        <p className="text-gray-500 mb-2">Thank you for your purchase. You&apos;ll receive a confirmation email shortly.</p>
        <p className="text-sm text-gray-400 mb-2">Your payment was processed securely.</p>
        <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-8">
          Don&apos;t see the email? Check your <strong>spam or junk folder</strong> and mark it as "Not spam".
        </p>

        {saveError && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">
            Order save issue: {saveError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/track" className="bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Track My Order
          </Link>
          <Link href="/products" className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><PageLoader /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
