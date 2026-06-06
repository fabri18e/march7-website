import { Suspense } from 'react';
import { getAllProducts } from '@/lib/products';
import ProductsClient from './ProductsClient';
import { PageLoader } from '@/components/Spinner';

export const revalidate = 60;

export default async function ProductsPage() {
  const products = await getAllProducts();
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 sm:px-6"><PageLoader /></div>}>
      <ProductsClient initialProducts={products} />
    </Suspense>
  );
}
