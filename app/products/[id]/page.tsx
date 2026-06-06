import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProducts } from '@/lib/products';
import ProductDetail from './ProductDetail';

// Revalidate every 60 seconds — product pages are cached and refreshed in the background
export const revalidate = 60;

export async function generateStaticParams() {
  const { getAllProducts } = await import('@/lib/products');
  const products = await getAllProducts();
  return products.map(p => ({ id: p.id }));
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const products = await getAllProducts();
  const product = products.find(p => p.id === params.id);
  if (!product) return { title: 'Product Not Found | March7' };

  const description = (product.shortDesc || product.description || '').slice(0, 155);
  const image = product.images?.[0] || product.image || null;

  return {
    title: `${product.name} | March7`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const products = await getAllProducts();
  const product = products.find(p => p.id === params.id);
  if (!product) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://www.march7.net';
  const image = product.images?.[0] || product.image || null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc || product.description || '',
    sku: product.id,
    brand: { '@type': 'Brand', name: 'March7' },
    ...(image ? { image: [image] } : {}),
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'March7' },
      shippingDetails: product.freeShipping ? {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'USD' },
      } : undefined,
    },
    ...(product.reviews?.length ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1),
        reviewCount: product.reviews.length,
      },
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} allProducts={products} />
    </>
  );
}
