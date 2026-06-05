export interface StaticReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
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
}
