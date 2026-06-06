import type { UserReview } from '@/types';

const SESSION_KEY = 'march7_session_id';
const RECENT_SEARCHES_KEY = 'march7_recent_searches';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function reviewsKey(productId: string) {
  return `march7_reviews_${productId}`;
}

export function getReviews(productId: string): UserReview[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(reviewsKey(productId)) || '[]');
  } catch {
    return [];
  }
}

export function addReview(
  productId: string,
  data: { name: string; rating: number; text: string; images?: string[] }
): UserReview {
  const reviews = getReviews(productId);
  const newReview: UserReview = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    productId,
    name: data.name,
    rating: data.rating,
    text: data.text,
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    sessionId: getSessionId(),
    ...(data.images?.length ? { images: data.images } : {}),
  };
  reviews.unshift(newReview);
  localStorage.setItem(reviewsKey(productId), JSON.stringify(reviews));
  return newReview;
}

export function deleteReview(productId: string, reviewId: string): void {
  const reviews = getReviews(productId).filter(r => r.id !== reviewId);
  localStorage.setItem(reviewsKey(productId), JSON.stringify(reviews));
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (!query.trim()) return;
  const searches = getRecentSearches().filter(s => s !== query);
  searches.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
}

export function clearRecentSearches(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }
}
