import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Script from 'next/script';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import GoogleAnalyticsTracker from '@/components/GoogleAnalyticsTracker';
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'optional',
});

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://www.march7.net';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'March7 | Quality Budget Tech',
    template: '%s | March7',
  },
  description: 'Factory-direct tech accessories. Every product personally tested for quality and value. Free shipping over $50.',
  keywords: ['tech accessories', 'budget tech', 'factory direct', 'earbuds', 'keyboards', 'gaming', 'peripherals'],
  authors: [{ name: 'March7' }],
  creator: 'March7',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'March7',
    title: 'March7 | Factory-Direct Tech. No Overpriced Brands.',
    description: 'Curated tech accessories personally tested for quality and value. Free shipping over $50.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'March7 | Factory-Direct Tech',
    description: 'Curated tech accessories personally tested for quality and value.',
  },
  icons: {
    icon: '/images/logo_tab.png',
    apple: '/images/logo_tab.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head />
      <body>
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-5J79VCN4Z0" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-5J79VCN4Z0');
        `}</Script>
        {/* TikTok Pixel */}
        <Script id="tiktok-pixel" strategy="lazyOnload">{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('D8IF6UBC77UB4KU2F500');
            ttq.page();
          }(window, document, 'ttq');
        `}</Script>
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "x31doa5ubs");
        `}</Script>
        <NextTopLoader color="#6366f1" height={3} showSpinner={false} />
        <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <GoogleAnalyticsTracker />
            <footer className="bg-gray-950 text-gray-400 mt-16 sm:mt-24">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
                  <div className="col-span-2 md:col-span-2">
                    <Image src="/images/logo.png" alt="March7" width={120} height={36} className="h-8 w-auto brightness-0 invert mb-3" />
                    <p className="text-sm leading-relaxed max-w-xs">
                      Curated tech accessories. Every product personally tested for quality and durability before listing.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold mb-3 sm:mb-4">Shop</h4>
                    <ul className="space-y-2 text-sm">
                      <li><a href="/products" className="hover:text-white transition-colors">All Products</a></li>
                      <li><a href="/products?category=Audio" className="hover:text-white transition-colors">Audio</a></li>
                      <li><a href="/products?category=Peripherals" className="hover:text-white transition-colors">Peripherals</a></li>
                      <li><a href="/products?category=Accessories" className="hover:text-white transition-colors">Accessories</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold mb-3 sm:mb-4">Support</h4>
                    <ul className="space-y-2 text-sm">
                      <li><a href="/track" className="hover:text-white transition-colors">Track Order</a></li>
                      <li><a href="/legal/faq" className="hover:text-white transition-colors">FAQ</a></li>
                      <li><a href="/legal/shipping" className="hover:text-white transition-colors">Shipping</a></li>
                      <li><a href="/legal/returns" className="hover:text-white transition-colors">Returns</a></li>
                      <li><a href="/legal/contact" className="hover:text-white transition-colors">Contact</a></li>
                      <li><a href="/legal/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                      <li><a href="/legal/terms" className="hover:text-white transition-colors">Terms</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 text-xs text-center sm:text-left">
                  <span>© {new Date().getFullYear()} March7. All rights reserved.</span>
                  <span className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                    <span>🔒 Secure Checkout</span>
                    <span className="hidden sm:inline">·</span>
                    <span>✓ Quality Verified</span>
                    <span className="hidden sm:inline">·</span>
                    <span>↩ 30-Day Returns</span>
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
