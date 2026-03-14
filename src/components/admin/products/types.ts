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

export interface ProductAttribute {
  id: string;
  attributeId: string;
  required: boolean;
  additionalCost: string; // decimal as string — matches Drizzle decimal column
  supportedOptions: string[] | null;
  attributeName: string; // joined from customizationAttributes
  attributeType: string; // 'text' | 'number' | 'boolean' | 'select' | 'multi_select'
  allOptions: string[] | null; // full option list from customizationAttributes.options
}

export interface ProductAttributeInput {
  attributeId: string;
  required: boolean;
  additionalCost: string; // keep as string — do NOT parse to number
  supportedOptions: string[] | null;
}
