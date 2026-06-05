'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('march7_cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('march7_cookie_consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('march7_cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-gray-950 text-white rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">🍪 We use cookies</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            We use cookies to keep your cart, remember your session, and improve your experience.
            No advertising or tracking cookies.{' '}
            <Link href="/legal/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="text-xs text-gray-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-xs font-semibold bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-xl transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
