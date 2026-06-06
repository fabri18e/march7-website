// Full-page loading screen with animated dots
export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <Dots />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

// Three animated bouncing dots
export function Dots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-accent animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  );
}

// Small inline spinner ring (for buttons etc.)
export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <div className={`${className} border-2 border-accent/20 border-t-accent rounded-full animate-spin`} />
  );
}
