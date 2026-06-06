'use client';

import { useState } from 'react';
import type { Product } from '@/types';

export default function AIAnalysis({ product }: { product: Product }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const hasData = product.pros.length > 0 || product.cons.length > 0;

  const analyze = () => {
    setState('loading');
    // Replace this setTimeout with a real fetch() to your AI API
    setTimeout(() => setState('done'), 1500);
  };

  const forWho = () => {
    if (product.tags.includes('gaming')) return 'Gamers and power users who want performance without paying premium brand prices.';
    if (product.category === 'Audio') return 'Music lovers and remote workers who need quality sound at a fair price.';
    if (product.category === 'Accessories') return 'Everyday users and travelers who value compact, reliable gear.';
    return 'Anyone looking for solid quality at a budget-friendly price point.';
  };

  const qualityLevel = () => {
    if (!product.reviews.length) return { label: 'Not yet rated', color: 'text-gray-500', bg: 'bg-gray-50' };
    const avg = product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length;
    if (avg >= 4.5) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (avg >= 4.0) return { label: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (avg >= 3.5) return { label: 'Good', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50' };
  };

  const quality = qualityLevel();

  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✅</span>
            <h4 className="font-semibold text-gray-900">Expert Review</h4>
          </div>
          <p className="text-sm text-gray-500">Honest pros and cons based on specs and real-world testing.</p>
        </div>
        {state === 'idle' && (
          <button
            onClick={analyze}
            disabled={!hasData}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {hasData ? '⚡ Analyze' : 'No data yet'}
          </button>
        )}
        {state === 'done' && (
          <button
            onClick={() => setState('idle')}
            className="flex-shrink-0 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Re-analyze
          </button>
        )}
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-indigo-600">Loading review...</span>
        </div>
      )}

      {state === 'done' && (
        <div className="space-y-5 mt-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${quality.bg} ${quality.color}`}>
            Quality Level: {quality.label}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 rounded-xl p-4">
              <h5 className="font-semibold text-green-700 mb-3 flex items-center gap-1.5 text-sm">
                <span>✓</span> Pros
              </h5>
              <ul className="space-y-2">
                {product.pros.map((pro, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <h5 className="font-semibold text-red-600 mb-3 flex items-center gap-1.5 text-sm">
                <span>✗</span> Honest Cons
              </h5>
              <ul className="space-y-2">
                {product.cons.map((con, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white/70 rounded-xl p-4">
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">Who is this for?</h5>
            <p className="text-sm text-gray-600">{forWho()}</p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Based on product specs and real-world testing
          </p>
        </div>
      )}

      {state === 'idle' && !hasData && (
        <p className="text-sm text-gray-500 mt-2">No pros/cons data available for this product yet.</p>
      )}
    </div>
  );
}
