'use client';

import { useEffect, useState } from 'react';

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (localStorage.getItem('m7_nl_dismissed')) return;
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem('m7_nl_dismissed', '1');
    setVisible(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
      setTimeout(dismiss, 2500);
    } catch {
      setStatus('error');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gray-900 px-6 pt-8 pb-6 text-center">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <p className="text-3xl mb-3">🛍️</p>
          <h2 className="text-white text-xl font-bold mb-1">Stay in the loop</h2>
          <p className="text-gray-400 text-sm">Be first to know about deals, drops, and exclusive offers.</p>
        </div>

        <div className="px-6 py-5">
          {status === 'done' ? (
            <div className="text-center py-2">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold text-gray-900">You're in!</p>
              <p className="text-sm text-gray-500 mt-1">We'll keep you updated on the best deals.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              {status === 'error' && (
                <p className="text-xs text-red-500">Something went wrong. Try again.</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
              <button type="button" onClick={dismiss} className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
                No thanks
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
