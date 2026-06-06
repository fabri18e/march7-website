'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  paid:        'bg-blue-50 text-blue-700',
  processing:  'bg-yellow-50 text-yellow-700',
  shipped:     'bg-purple-50 text-purple-700',
  delivered:   'bg-green-50 text-green-700',
  refunded:    'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-50 text-red-600',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (authLoading || loading) {
    return <div className="max-w-3xl mx-auto px-6"><PageLoader /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>
        <Link href="/products" className="text-sm text-accent hover:underline">
          Continue shopping →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-gray-100 rounded-2xl">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
            </svg>
          </div>
          <p className="font-medium text-gray-700">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Your past purchases will appear here.</p>
          <Link href="/products" className="inline-block mt-4 text-sm text-accent hover:underline">
            Browse products →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-mono text-gray-500">
                    #{order.stripe_session_id.slice(-8).toUpperCase()}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${(order.total_amount / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="text-gray-500">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {order.shipping_address && (
                <div className="px-5 pb-4 text-xs text-gray-400">
                  📦 {[
                    order.shipping_address.line1,
                    order.shipping_address.city,
                    order.shipping_address.state,
                    order.shipping_address.country
                  ].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
        Need help with an order?{' '}
        <Link href="/legal/returns" className="text-accent hover:underline">View return policy</Link>
        {' '}or{' '}
        <a href="mailto:store@march7.net" className="text-accent hover:underline">contact support</a>.
      </div>
    </div>
  );
}
