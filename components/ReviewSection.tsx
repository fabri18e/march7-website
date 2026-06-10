'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { StaticReview } from '@/types';
import StarRating from './StarRating';
import { useAuth } from '@/context/AuthContext';

function avgRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

interface DBReview {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  text: string;
  images: string[];
  verified: boolean;
  display_date: string | null;
  created_at: string;
}

interface ReviewSectionProps {
  productId: string;
  staticReviews: StaticReview[];
  autoOpenForm?: boolean;
}

type Step = 'idle' | 'verifying' | 'writing';

export default function ReviewSection({ productId, staticReviews, autoOpenForm }: ReviewSectionProps) {
  const { user } = useAuth();
  const [dbReviews, setDbReviews] = useState<DBReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Verification step
  const [step, setStep] = useState<Step>('idle');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Saved email (after verification accepted)
  const [authorEmail, setAuthorEmail] = useState('');

  // Review form
  const [form, setForm] = useState({ name: user?.user_metadata?.full_name || '', rating: 0, text: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      const data = await res.json();
      if (res.ok) setDbReviews(data.reviews || []);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (autoOpenForm) {
      if (user?.email) {
        setAuthorEmail(user.email);
        setStep('writing');
      } else {
        setStep('verifying');
      }
    }
  }, [autoOpenForm, user]);

  // All displayed reviews: DB reviews + static reviews
  const allReviews = [
    ...dbReviews.map(r => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      text: r.text,
      images: r.images,
      date: r.display_date || new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      verified: r.verified,
      isDB: true,
      email: '', // not exposed in display
    })),
    ...staticReviews.map(r => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      text: r.text,
      images: r.images || [],
      date: r.date,
      verified: !!r.verified,
      isDB: false,
      isExternal: !!r.source,
      email: '',
    })),
  ];

  const avg = avgRating(allReviews);
  const ratingCounts = [5, 4, 3, 2, 1].map(n => allReviews.filter(r => r.rating === n).length);

  // Check if user already reviewed (using stored email)
  const storedEmail = typeof window !== 'undefined' ? localStorage.getItem(`march7_reviewed_${productId}`) : null;
  const hasMyReview = !!storedEmail;

  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyEmail.trim()) { setVerifyError('Enter your email.'); return; }

    const normalizedEmail = verifyEmail.toLowerCase().trim();

    // Check if already reviewed on this device
    const existing = localStorage.getItem(`march7_reviewed_${productId}`);
    if (existing === normalizedEmail) {
      setVerifyError('You already reviewed this product.');
      return;
    }

    setVerifying(true);
    setVerifyError('');

    const res = await fetch(`/api/check-purchase?email=${encodeURIComponent(normalizedEmail)}`);
    const data = await res.json();
    setVerifying(false);

    if (!data.purchased) {
      setVerifyError('No delivered order found for this email. Only customers with a delivered order can leave a review.');
      return;
    }

    setAuthorEmail(normalizedEmail);
    setStep('writing');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Enter your name.'); return; }
    if (form.rating === 0) { setFormError('Select a rating.'); return; }
    if (!form.text.trim()) { setFormError('Write a review.'); return; }
    setSubmitting(true);
    setFormError('');

    let imageUrls: string[] = [];
    if (selectedFiles.length > 0) {
      setUploadingImages(true);
      try {
        imageUrls = await Promise.all(selectedFiles.map(async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/upload-review-image', { method: 'POST', body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          return data.url as string;
        }));
      } catch {
        setFormError('Image upload failed. Try again or remove images.');
        setSubmitting(false);
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        email: authorEmail,
        name: form.name.trim(),
        rating: form.rating,
        text: form.text.trim(),
        images: imageUrls,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error || 'Failed to submit review.');
      setSubmitting(false);
      return;
    }

    // Save email locally so we know they already reviewed
    localStorage.setItem(`march7_reviewed_${productId}`, authorEmail);

    setDbReviews(prev => [data.review, ...prev]);
    setForm({ name: '', rating: 0, text: '' });
    setSelectedFiles([]);
    setStep('idle');
    setSubmitting(false);
  };

  const handleDelete = async (reviewId: string) => {
    const email = localStorage.getItem(`march7_reviewed_${productId}`);
    if (!email) return;
    await fetch(`/api/reviews?id=${reviewId}&email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    setDbReviews(prev => prev.filter(r => r.id !== reviewId));
    localStorage.removeItem(`march7_reviewed_${productId}`);
  };

  return (
    <div>
      {/* Rating summary */}
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

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">
          {loadingReviews ? '...' : allReviews.length === 0 ? 'No reviews yet' : `${allReviews.length} Review${allReviews.length !== 1 ? 's' : ''}`}
        </h3>

        {step === 'idle' && (
          hasMyReview ? (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 text-right max-w-[200px]">
              You already reviewed this product. Delete your review to write a new one.
            </div>
          ) : (
            <button
              onClick={() => {
                if (user?.email) {
                  // Logged-in: skip email step, use account email directly
                  setAuthorEmail(user.email);
                  setStep('writing');
                } else {
                  setStep('verifying');
                }
              }}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" d="M12 4v16m8-8H4"/>
              </svg>
              Write a Review
            </button>
          )
        )}
      </div>

      {/* Step 1: enter email */}
      {step === 'verifying' && (
        <form onSubmit={handleVerify} className="mb-8 p-5 border border-gray-200 rounded-2xl space-y-4 bg-gray-50">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Write a Review</h4>
            <p className="text-xs text-gray-500">Enter the email you used to place your order. We&apos;ll check if your purchase was delivered and award a Verified Buyer badge.</p>
          </div>
          {verifyError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{verifyError}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Order Email</label>
            <input
              type="email"
              value={verifyEmail}
              onChange={e => setVerifyEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={verifying} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              {verifying ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Checking...</> : 'Continue'}
            </button>
            <button type="button" onClick={() => { setStep('idle'); setVerifyError(''); setVerifyEmail(''); }} className="text-sm text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Step 2: write review */}
      {step === 'writing' && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 border border-gray-200 rounded-2xl space-y-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">Your Review</h4>
          </div>
          {formError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
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
          {/* Photo upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Photos <span className="text-gray-400 font-normal">(optional, max 3 · 5MB each)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelectedFiles(f => f.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs leading-none hover:bg-black/80"
                  >×</button>
                </div>
              ))}
              {selectedFiles.length < 3 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-light transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.5" strokeLinecap="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span className="text-xs text-gray-400 mt-0.5">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFiles(f => [...f.slice(0, 2), file]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              {submitting ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{uploadingImages ? 'Uploading photos...' : 'Posting...'}</>
              ) : 'Post Review'}
            </button>
            <button type="button" onClick={() => { setStep('idle'); setFormError(''); setSelectedFiles([]); }} className="text-sm text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      <div className="space-y-5">
        {allReviews.map((review, i) => {
          const myEmail = typeof window !== 'undefined' ? localStorage.getItem(`march7_reviewed_${productId}`) : null;
          const isOwn = review.isDB && myEmail !== null;
          const isExternal = !review.isDB && (review as { isExternal?: boolean }).isExternal;

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
                      {review.verified && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Verified Buyer
                        </span>
                      )}
                      {isExternal && (
                        <span className="text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                          External
                        </span>
                      )}
                      {isOwn && (
                        <span className="text-xs bg-blue-50 text-accent px-2 py-0.5 rounded-full font-medium">You</span>
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
              {review.images && review.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pl-12">
                  {review.images.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxUrl(url)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 transition-opacity flex-shrink-0"
                    >
                      <Image src={url} alt={`Review photo ${idx + 1}`} fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {!loadingReviews && allReviews.length === 0 && step === 'idle' && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Be the first to review this product</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Review photo"
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {staticReviews.some(r => r.source) && (
        <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
          * Some reviews sourced from other platforms.
        </p>
      )}
    </div>
  );
}
