export interface StaticReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
  source?: string;
  images?: string[];
  verified?: boolean;
}

export interface ProductBundle {
  productIds: string[];
  bundlePrice: number;
  label?: string;
}

export interface ProductVariant {
  color: string;
  hex?: string;
  images: string[];
  price?: number;
  oldPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  description: string;
  shortDesc: string;
  category: string;
  tags: string[];
  badge?: string | null;
  image?: string | null;
  features: string[];
  specs: [string, string][];
  pros: string[];
  cons: string[];
  reviews: StaticReview[];
  supplierUrl?: string | null;
  supplierPrice?: number | null;
  images?: string[];
  freeShipping?: boolean;
  defaultColorLabel?: string | null;
  defaultColorHex?: string | null;
  variants?: ProductVariant[];
  isBundle?: boolean;
  bundleItems?: string[];
  bundleDiscount?: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  qty: number;
}

export interface UserReview {
  id: string;
  productId: string;
  name: string;
  rating: number;
  date: string;
  text: string;
  sessionId: string;
  images?: string[];
}
