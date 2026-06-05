'use client';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${sizes[size]} transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill={star <= value ? '#F59E0B' : 'none'} stroke={star <= value ? '#F59E0B' : '#D1D5DB'} strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}
