import type {
  Category,
  Product,
  ProductDetail,
  ProductFormData,
  ProductsResponse,
} from "./types";

export async function fetchProducts(params: {
  page: number;
  search: string;
  categoryId: string;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "25",
    search: params.search,
    categoryId: params.categoryId,
  });
  const response = await fetch(`/api/admin/products?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/admin/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create product");
  }
  return response.json();
}

export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>,
): Promise<Product> {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update product");
  }
  return response.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete product");
  }
}

export async function fetchProduct(id: string): Promise<ProductDetail> {
  const response = await fetch(`/api/admin/products/${id}`);
  if (!response.ok) throw new Error("Failed to fetch product");
  return response.json();
}

export async function duplicateProduct(id: string) {
  const res = await fetch(`/api/admin/products/${id}/duplicate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to duplicate");
  return res.json();
}
