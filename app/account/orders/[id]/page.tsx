'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageLoader } from '@/components/Spinner';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

interface Order {
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

const STEPS = [
  { key: 'paid',       label: 'Order Placed',  icon: '🧾', desc: 'Payment confirmed' },
  { key: 'processing', label: 'Processing',     icon: '⚙️', desc: 'Preparing your order' },
  { key: 'shipped',    label: 'Shipped',        icon: '📦', desc: 'On its way to you' },
  { key: 'delivered',  label: 'Delivered',      icon: '✅', desc: 'Enjoy your product!' },
];

const STATUS_ORDER = ['paid', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setOrder(data as Order);
        setLoading(false);
      });
  }, [user, orderId]);

  if (authLoading || loading) {
    return <div className="max-w-2xl mx-auto px-6"><PageLoader /></div>;
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-gray-500 mb-4">Order not found.</p>
        <Link href="/account" className="text-accent hover:underline text-sm">← Back to My Orders</Link>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/account" className="text-sm text-accent hover:underline mb-6 inline-block">
        ← Back to My Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            #{order.stripe_session_id.replace('paypal_', '').slice(-10).toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">${(order.total_amount / 100).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(order.created_at).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Timeline */}
      {!isCancelled ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-6">Order Progress</h3>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
            <div
              className="absolute left-5 top-5 w-0.5 bg-accent transition-all duration-500"
              style={{ height: currentStep > 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : '0%' }}
            />

            <div className="space-y-6">
              {STEPS.map((step, i) => {
                const isCompleted = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-base z-10 transition-all ${
                      isCompleted
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    <div className="pt-1.5">
                      <p className={`font-semibold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full font-medium">
                            Current
                          </span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                        {step.desc}
                      </p>

                      {/* Tracking info on shipped step */}
                      {step.key === 'shipped' && isCompleted && order.tracking_number && (
                        <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2 inline-block">
                          <p className="text-xs text-gray-500">Tracking number</p>
                          {order.tracking_url ? (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-mono font-semibold text-accent hover:underline"
                            >
                              {order.tracking_number} →
                            </a>
                          ) : (
                            <p className="text-sm font-mono font-semibold text-gray-900">
                              {order.tracking_number}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Estimated delivery */}
                      {step.key === 'shipped' && isCompleted && order.estimated_delivery && (
                        <p className="text-xs text-gray-500 mt-1">
                          Estimated delivery:{' '}
                          <strong>
                            {new Date(order.estimated_delivery).toLocaleDateString('en-US', {
                              month: 'long', day: 'numeric', year: 'numeric'
                            })}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-700 capitalize">{order.status}</p>
            <p className="text-sm text-red-500">
              {order.status === 'refunded'
                ? 'This order has been refunded. Funds should appear in 5–10 business days.'
                : 'This order was cancelled.'}
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">${item.unit_price?.toFixed(2)} each</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${item.total?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">${(order.total_amount / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-600">
            {[
              order.shipping_address.line1,
              order.shipping_address.line2,
              order.shipping_address.city,
              order.shipping_address.state,
              order.shipping_address.postal_code,
              order.shipping_address.country,
            ].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {/* Support */}
      <div className="text-center text-sm text-gray-400">
        Problem with your order?{' '}
        <a href="mailto:support@march7.net" className="text-accent hover:underline">
          Contact support
        </a>
        {' '}·{' '}
        <Link href="/legal/returns" className="text-accent hover:underline">
          Return policy
        </Link>
      </div>
    </div>
  );
}
