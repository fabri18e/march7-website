import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse our full catalog of factory-direct tech accessories. Quality tested keyboards, earbuds, gaming gear and more.',
  openGraph: {
    title: 'All Products | March7',
    description: 'Browse our full catalog of factory-direct tech accessories. Quality tested and value-priced.',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
