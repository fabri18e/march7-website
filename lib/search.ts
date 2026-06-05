import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Product } from '@/types';

const FUSE_OPTIONS: IFuseOptions<Product> = {
  keys: [
    { name: 'name',      weight: 0.45 },
    { name: 'category',  weight: 0.20 },
    { name: 'tags',      weight: 0.15 },
    { name: 'shortDesc', weight: 0.12 },
    { name: 'features',  weight: 0.05 },
    { name: 'description', weight: 0.03 },
  ],
  threshold: 0.4,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true,
};

let _instance: { fuse: Fuse<Product>; products: Product[] } | null = null;

function getInstance(products: Product[]) {
  if (!_instance || _instance.products !== products) {
    _instance = { fuse: new Fuse(products, FUSE_OPTIONS), products };
  }
  return _instance.fuse;
}

export function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;
  return getInstance(products).search(query).map(r => r.item);
}

export function productMatchesSearch(product: Product, query: string): boolean {
  if (!query.trim()) return true;
  return new Fuse([product], FUSE_OPTIONS).search(query).length > 0;
}
