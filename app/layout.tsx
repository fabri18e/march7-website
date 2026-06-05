import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import CookieBanner from '@/components/CookieBanner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'March7 | Quality Budget Tech',
  description: 'Curated tech accessories. Every product personally tested for quality and durability.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <CookieBanner />
            <footer className="bg-gray-950 text-gray-400 mt-24">
              <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div className="md:col-span-2">
                  <span className="text-white text-xl font-bold tracking-tight">March7</span>
                  <p className="mt-3 text-sm leading-relaxed max-w-xs">
                    Curated tech accessories. Every product personally tested for quality and durability before listing.
                  </p>
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-4">Shop</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/products" className="hover:text-white transition-colors">All Products</a></li>
                    <li><a href="/products?category=Audio" className="hover:text-white transition-colors">Audio</a></li>
                    <li><a href="/products?category=Peripherals" className="hover:text-white transition-colors">Peripherals</a></li>
                    <li><a href="/products?category=Accessories" className="hover:text-white transition-colors">Accessories</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-4">Support</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/legal/faq" className="hover:text-white transition-colors">FAQ</a></li>
                    <li><a href="/legal/shipping" className="hover:text-white transition-colors">Shipping Policy</a></li>
                    <li><a href="/legal/returns" className="hover:text-white transition-colors">Returns</a></li>
                    <li><a href="/legal/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                    <li><a href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800">
                <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                  <span>© {new Date().getFullYear()} March7. All rights reserved.</span>
                  <span className="flex items-center gap-3">
                    <span>🔒 Secure Checkout</span>
                    <span>·</span>
                    <span>✓ Quality Verified</span>
                    <span>·</span>
                    <span>↩ 14-Day Returns</span>
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
