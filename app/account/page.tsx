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
  total_amount: number;
  status: string;
  items: { name: string; quantity: number; total: number }[];
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

type Section = 'orders' | 'settings';

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Settings state
  const [name, setName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || '');
      const supabase = getSupabase();
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders((data as Order[]) ?? []);
          setOrdersLoading(false);
        });
    }
  }, [user]);

  const updateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameMsg('');
    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    if (!error) {
      await supabase.from('profiles').update({ full_name: name } as never).eq('id', user!.id);
      setNameMsg('Name updated!');
    } else {
      setNameMsg(error.message);
    }
    setNameLoading(false);
  };

  const sendPasswordReset = async () => {
    setPwLoading(true);
    setPwMsg('');
    const supabase = getSupabase();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, {
      redirectTo: `${origin}/auth/reset`,
    });
    setPwMsg(error ? error.message : 'Reset link sent to your email!');
    setPwLoading(false);
  };

  const deleteAccount = async () => {
    const supabase = getSupabase();
    await supabase.from('profiles').delete().eq('id', user!.id);
    await signOut();
    router.replace('/');
  };

  if (authLoading) {
    return <div className="max-w-3xl mx-auto px-6"><PageLoader /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center text-accent font-bold text-lg">
          {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {user?.user_metadata?.full_name || 'My Account'}
          </h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-8">
        {([['orders', 'My Orders'], ['settings', 'Settings']] as [Section, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              section === key ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ORDERS */}
      {section === 'orders' && (
        <div>
          {ordersLoading ? (
            <p className="text-gray-400 text-sm">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border border-gray-100 rounded-2xl">
              <p className="font-medium text-gray-700 mb-1">No orders yet</p>
              <p className="text-sm text-gray-400 mb-4">Your purchases will appear here.</p>
              <Link href="/products" className="text-sm text-accent hover:underline">Browse products →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Link key={order.id} href={`/account/orders/${order.id}`} className="block border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono text-gray-500">
                        #{order.stripe_session_id.replace('paypal_', '').slice(-8).toUpperCase()}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${(order.total_amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-3 space-y-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.quantity}× {item.name}</span>
                        <span className="text-gray-500">${item.total?.toFixed(2)}</span>
                      </div>
                    ))}
                    <p className="text-xs text-accent pt-1">View tracking →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-6 text-center">
            Need help?{' '}
            <Link href="/legal/returns" className="text-accent hover:underline">Return policy</Link>
            {' '}·{' '}
            <a href="mailto:support@march7.com" className="text-accent hover:underline">Contact support</a>
          </p>
        </div>
      )}

      {/* SETTINGS */}
      {section === 'settings' && (
        <div className="space-y-8 max-w-md">
          {/* Change name */}
          <div className="border border-gray-100 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Display Name</h3>
            <form onSubmit={updateName} className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={nameLoading}
                className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                {nameLoading ? '...' : 'Save'}
              </button>
            </form>
            {nameMsg && (
              <p className={`text-xs mt-2 ${nameMsg.includes('updated') ? 'text-green-600' : 'text-red-500'}`}>
                {nameMsg}
              </p>
            )}
          </div>

          {/* Change password */}
          <div className="border border-gray-100 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Password</h3>
            <p className="text-sm text-gray-500 mb-4">We&apos;ll send a reset link to <strong>{user?.email}</strong></p>
            <button
              onClick={sendPasswordReset}
              disabled={pwLoading}
              className="border border-gray-200 hover:bg-gray-50 disabled:opacity-60 text-sm font-medium text-gray-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              {pwLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            {pwMsg && (
              <p className={`text-xs mt-2 ${pwMsg.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                {pwMsg}
              </p>
            )}
          </div>

          {/* Sign out */}
          <div className="border border-gray-100 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Sign Out</h3>
            <p className="text-sm text-gray-500 mb-4">Sign out from this device.</p>
            <button
              onClick={() => { signOut(); router.replace('/'); }}
              className="border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Delete account */}
          <div className="border border-red-100 rounded-2xl p-6">
            <h3 className="font-semibold text-red-600 mb-1">Delete Account</h3>
            <p className="text-sm text-gray-500 mb-4">This will permanently delete your account and all data. This action cannot be undone.</p>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="border border-red-200 hover:bg-red-50 text-sm font-medium text-red-600 px-4 py-2.5 rounded-xl transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={deleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  Yes, delete permanently
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
