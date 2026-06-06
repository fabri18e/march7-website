'use client';

import { useState, Suspense } from 'react';
import { PageLoader, Dots } from '@/components/Spinner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const STATUS_STEPS = ['paid', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  paid:       'Order Received',
  processing: 'Preparing',
  shipped:    'On the Way',
  delivered:  'Delivered',
  refunded:   'Refunded',
  cancelled:  'Cancelled',
};

const STATUS_ICONS: Record<string, string> = {
  paid:       '🧾',
  processing: '📦',
  shipped:    '🚚',
  delivered:  '✅',
  refunded:   '↩',
  cancelled:  '✕',
};

interface OrderResult {
  id: string;
  stripe_session_id: string;
  email: string;
  total_amount: number;
  status: string;
  items: { name: string; quantity: number; unit_price: number; total: number }[];
  shipping_address: Record<string, string> | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

function TrackContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [orderCode, setOrderCode] = useState(searchParams.get('order') ?? '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !orderCode.trim()) {
      setError('Please enter both your email and order number.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);

    const res = await fetch(
      `/api/track-order?email=${encodeURIComponent(email.trim())}&order=${encodeURIComponent(orderCode.trim())}`
    );
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setOrder(data.order);
  };

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isTerminal = order && ['refunded', 'cancelled'].includes(order.status);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
        <p className="text-sm text-gray-500 mt-1">Enter the email and order number from your confirmation email.</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Order Number</label>
          <input
            type="text"
            value={orderCode}
            onChange={e => setOrderCode(e.target.value.toUpperCase())}
            placeholder="e.g. AB12CD34EF"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-xs text-gray-400 mt-1.5">Found in your order confirmation email under &ldquo;Order #&rdquo;</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2.5 rounded-xl">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <Dots />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path strokeWidth="2" strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              Track Order
            </>
          )}
        </button>
      </form>

      {/* Order result */}
      {order && (
        <div className="mt-6 space-y-4">
          {/* Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 font-mono">Order #{order.stripe_session_id.replace('paypal_', '').slice(-10).toUpperCase()}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${(order.total_amount / 100).toFixed(2)}</p>
                <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Status</h2>

            {isTerminal ? (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${order.status === 'refunded' ? 'bg-gray-50 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                <span className="text-xl">{STATUS_ICONS[order.status]}</span>
                <div>
                  <p className="font-semibold capitalize">{order.status}</p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {order.status === 'refunded' ? 'Your refund has been processed.' : 'This order was cancelled.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  const active = i === stepIndex;
                  const isLast = i === STATUS_STEPS.length - 1;
                  return (
                    <div key={step} className="flex gap-3">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-colors ${
                          active ? 'bg-accent text-white shadow-md shadow-accent/30' :
                          done ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {done && !active ? '✓' : STATUS_ICONS[step]}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 my-1 ${i < stepIndex ? 'bg-green-200' : 'bg-gray-100'}`} style={{ minHeight: 20 }} />
                        )}
                      </div>
                      {/* Label */}
                      <div className="pb-5 pt-1 flex-1">
                        <p className={`text-sm font-semibold ${active ? 'text-accent' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                          {STATUS_LABELS[step]}
                        </p>
                        {active && step === 'shipped' && order.tracking_number && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Tracking: <span className="font-mono font-semibold">{order.tracking_number}</span>
                          </p>
                        )}
                        {active && step === 'shipped' && order.estimated_delivery && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tracking link button */}
            {order.tracking_url && order.status === 'shipped' && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 w-full border border-accent text-accent hover:bg-accent hover:text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                Track Package →
              </a>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Items Ordered</h2>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}× {item.name}</span>
                  <span className="text-gray-500 font-medium">${item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm font-bold">
                <span>Total</span>
                <span>${(order.total_amount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Shipping To</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {[
                  order.shipping_address.name,
                  order.shipping_address.line1,
                  order.shipping_address.line2,
                  [order.shipping_address.city, order.shipping_address.state, order.shipping_address.postal_code].filter(Boolean).join(', '),
                  order.shipping_address.country,
                ].filter(Boolean).join('\n')}
              </p>
            </div>
          )}

          {/* Help */}
          <p className="text-xs text-center text-gray-400">
            Need help?{' '}
            <Link href="/legal/contact" className="text-accent hover:underline">Contact support</Link>
            {' '}·{' '}
            <Link href="/legal/returns" className="text-accent hover:underline">Return policy</Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-6"><PageLoader /></div>}>
      <TrackContent />
    </Suspense>
  );
}
