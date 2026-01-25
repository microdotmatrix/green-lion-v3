import type {
  Attribute,
  Category,
  CategoryAttribute,
  CategoryFormData,
} from "./types";

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/admin/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

export async function createCategory(
  data: CategoryFormData,
): Promise<Category> {
  const response = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create category");
  }
  return response.json();
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryFormData>,
): Promise<Category> {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update category");
  }
  return response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete category");
  }
}

export async function fetchCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/admin/categories/${id}`);
  if (!response.ok) throw new Error("Failed to fetch category");
  return response.json();
}

export async function fetchCategoryAttributes(
  categoryId: string,
): Promise<CategoryAttribute[]> {
  const response = await fetch(
    `/api/admin/categories/${categoryId}/attributes`,
  );
  if (!response.ok) throw new Error("Failed to fetch category attributes");
  return response.json();
}

export async function fetchAllAttributes(): Promise<Attribute[]> {
  const response = await fetch("/api/admin/attributes");
  if (!response.ok) throw new Error("Failed to fetch attributes");
  return response.json();
}

export async function assignAttribute(
  categoryId: string,
  attributeId: string,
): Promise<void> {
  const response = await fetch(
    `/api/admin/categories/${categoryId}/attributes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributeId }),
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assign attribute");
  }
}

export async function removeAttribute(
  categoryId: string,
  attributeId: string,
): Promise<void> {
  const response = await fetch(
    `/api/admin/categories/${categoryId}/attributes`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributeId }),
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove attribute");
  }
}
