import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you were looking for doesn\'t exist.',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 text-center">
      {/* Big 404 */}
      <div className="relative mb-8">
        <p className="text-[120px] sm:text-[160px] font-black text-gray-100 leading-none select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white px-4 py-1 rounded-full border border-gray-200 shadow-sm">
            <span className="text-sm font-semibold text-gray-500">Page not found</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        Oops, nothing here
      </h1>
      <p className="text-gray-500 max-w-sm mb-8 text-sm sm:text-base">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          ← Back to Home
        </Link>
        <Link
          href="/products"
          className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Browse Products
        </Link>
      </div>

      {/* Quick links */}
      <div className="mt-12 pt-8 border-t border-gray-100 w-full max-w-sm">
        <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider font-semibold">Quick links</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { href: '/products?category=Audio', label: 'Audio' },
            { href: '/products?category=Gaming', label: 'Gaming' },
            { href: '/products?category=Peripherals', label: 'Peripherals' },
            { href: '/legal/faq', label: 'FAQ' },
            { href: '/legal/contact', label: 'Contact' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
