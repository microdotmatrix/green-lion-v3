export interface Category {
  id: string;
  name: string;
}

export interface PricingTier {
  id?: string;
  minQuantity: number;
  pricePerUnit: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  images: string[];
  categoryId: string | null;
  categoryName: string | null;
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
  logoCost: string;
  packagingCost: string;
  createdAt: string;
  priceRange: { min: string; max: string } | null;
}

export type ProductSortBy =
  | "createdAt"
  | "title"
  | "sku"
  | "category"
  | "price";

export type ProductSortDir = "asc" | "desc";

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
  logoCost: string;
  packagingCost: string;
  images: string[];
  pricingTiers: PricingTier[];
}

export interface ProductDetail extends Product {
  pricingTiers: PricingTier[];
}
