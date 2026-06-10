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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3">
      <div className="max-w-2xl mx-auto bg-gray-950 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <p className="flex-1 text-xs text-gray-400 leading-snug min-w-0">
          We use cookies to improve your experience.{' '}
          <Link href="/legal/privacy" className="text-accent hover:underline whitespace-nowrap">Privacy Policy</Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={decline} className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            Decline
          </button>
          <button onClick={accept} className="text-xs font-semibold bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-lg transition-colors">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
