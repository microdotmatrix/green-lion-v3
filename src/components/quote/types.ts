export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  images: string[];
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
  categoryId: string | null;
  price: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: string | null;
  image?: string;
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  title: string;
}

export const CART_KEY = "quoteCart";

export const INITIAL_CUSTOMER_INFO: CustomerInfo = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  title: "",
};
