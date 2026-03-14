import type {
  Category,
  Product,
  ProductAttribute,
  ProductAttributeInput,
  ProductDetail,
  ProductFormData,
  ProductsResponse,
  ProductSortBy,
  ProductSortDir,
} from "./types";

export async function fetchProducts(params: {
  page: number;
  search: string;
  categoryId: string;
  attributeId: string;
  sortBy: ProductSortBy;
  sortDir: ProductSortDir;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "25",
    search: params.search,
    categoryId: params.categoryId,
    attributeId: params.attributeId,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
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

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: Array<{ row: number; sku?: string; reason: string }>;
}

export async function importProducts(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  // Do NOT set Content-Type header — browser sets multipart boundary automatically
  const res = await fetch("/api/admin/products/import", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Import failed");
  }
  return res.json();
}

export async function exportProducts(): Promise<void> {
  const res = await fetch("/api/admin/products/export");
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchProductAttributes(
  productId: string,
): Promise<ProductAttribute[]> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`);
  if (!response.ok) throw new Error("Failed to fetch product attributes");
  return response.json();
}

export async function assignProductAttribute(
  productId: string,
  data: ProductAttributeInput,
): Promise<void> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assign attribute");
  }
}

export async function updateProductAttribute(
  productId: string,
  data: ProductAttributeInput & { attributeId: string },
): Promise<void> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update attribute");
  }
}

export async function removeProductAttribute(
  productId: string,
  attributeId: string,
): Promise<void> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attributeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove attribute");
  }
}
