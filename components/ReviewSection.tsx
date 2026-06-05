'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { StaticReview, UserReview } from '@/types';
import StarRating from './StarRating';
import { getReviews, addReview, deleteReview, getSessionId } from '@/lib/reviews';
import { useAuth } from '@/context/AuthContext';

function avgRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

interface ReviewSectionProps {
  productId: string;
  staticReviews: StaticReview[];
  autoOpenForm?: boolean;
}

export default function ReviewSection({ productId, staticReviews, autoOpenForm }: ReviewSectionProps) {
  const { user } = useAuth();
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 0, text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  useEffect(() => {
    setUserReviews(getReviews(productId));
    setSessionId(getSessionId());
  }, [productId]);

  // Check purchase via API route (uses service role — bypasses RLS)
  useEffect(() => {
    if (!user) return;
    setCheckingPurchase(true);
    fetch(`/api/check-purchase?userId=${user.id}&productId=${productId}`)
      .then(r => r.json())
      .then(data => {
        setHasPurchased(data.purchased);
        setCheckingPurchase(false);
      })
      .catch(() => setCheckingPurchase(false));
  }, [user, productId]);

  // Pre-fill name from user profile
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setForm(p => ({ ...p, name: user.user_metadata.full_name }));
    }
  }, [user]);

  // Auto-open form if coming from delivery email
  useEffect(() => {
    if (autoOpenForm && hasPurchased) setShowForm(true);
  }, [autoOpenForm, hasPurchased]);

  const allReviews = [
    ...userReviews,
    ...staticReviews.map(r => ({ ...r, productId, sessionId: '__static__' })),
  ];
  const avg = avgRating(allReviews);
  const ratingCounts = [5, 4, 3, 2, 1].map(n => allReviews.filter(r => r.rating === n).length);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (form.rating === 0) { setError('Please select a rating.'); return; }
    if (!form.text.trim()) { setError('Please write a review.'); return; }
    setSubmitting(true);
    setTimeout(() => {
      const newReview = addReview(productId, form);
      setUserReviews(prev => [newReview, ...prev]);
      setForm(p => ({ ...p, rating: 0, text: '' }));
      setShowForm(false);
      setError('');
      setSubmitting(false);
    }, 400);
  };

  const handleDelete = (reviewId: string) => {
    deleteReview(productId, reviewId);
    setUserReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  return (
    <div>
      {allReviews.length > 0 && (
        <div className="flex gap-8 mb-10 p-6 bg-gray-50 rounded-2xl">
          <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
            <span className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</span>
            <StarRating value={Math.round(avg)} readonly size="sm" />
            <span className="text-xs text-gray-500">{allReviews.length} review{allReviews.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((n, i) => (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">{n}</span>
                <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="#F59E0B">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: allReviews.length ? `${(ratingCounts[i] / allReviews.length) * 100}%` : '0%' }} />
                </div>
                <span className="text-xs text-gray-400 w-4">{ratingCounts[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">
          {allReviews.length === 0 ? 'No reviews yet' : `${allReviews.length} Review${allReviews.length !== 1 ? 's' : ''}`}
        </h3>

        {/* Write review button — gated behind login + purchase */}
        {!user ? (
          <Link
            href="/auth"
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Sign in to Review
          </Link>
        ) : checkingPurchase ? null : !hasPurchased ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            Purchase required to review
          </div>
        ) : (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" d="M12 4v16m8-8H4"/>
            </svg>
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 border border-gray-200 rounded-2xl space-y-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">Your Review</h4>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Verified Purchase
            </span>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Your Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Rating</label>
            <StarRating value={form.rating} onChange={r => setForm(p => ({ ...p, rating: r }))} size="lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Review</label>
            <textarea
              value={form.text}
              onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
              placeholder="Share your honest experience..."
              rows={4}
              className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="text-sm text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-5">
        {allReviews.map((review, i) => {
          const isOwn = review.sessionId === sessionId && review.sessionId !== '__static__';
          const isVerified = review.sessionId !== '__static__';
          return (
            <div key={review.id ?? i} className="pb-5 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">{review.name}</span>
                      {isOwn && (
                        <span className="text-xs bg-blue-50 text-accent px-2 py-0.5 rounded-full font-medium">You</span>
                      )}
                      {isVerified && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating value={review.rating} readonly size="sm" />
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                  </div>
                </div>
                {isOwn && (
                  <button onClick={() => handleDelete(review.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2" strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed pl-12">{review.text}</p>
            </div>
          );
        })}

        {allReviews.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Be the first to review this product</p>
          </div>
        )}
      </div>
    </div>
  );
}
