import type { Catalog, CatalogFormData } from "./types";

export async function fetchCatalogs(): Promise<Catalog[]> {
  const response = await fetch("/api/admin/catalogs");
  if (!response.ok) throw new Error("Failed to fetch catalogs");
  return response.json();
}

export async function createCatalog(data: CatalogFormData): Promise<Catalog> {
  const response = await fetch("/api/admin/catalogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create catalog");
  }
  return response.json();
}

export async function setActiveCatalog(id: string): Promise<void> {
  const response = await fetch(`/api/admin/catalogs/${id}`, {
    method: "PUT",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to set active catalog");
  }
}

export async function deleteCatalog(id: string): Promise<void> {
  const response = await fetch(`/api/admin/catalogs/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete catalog");
  }
}
