import type { Attribute, AttributeFormData } from "./types";

export async function fetchAttributes(): Promise<Attribute[]> {
  const response = await fetch("/api/admin/attributes");
  if (!response.ok) throw new Error("Failed to fetch attributes");
  return response.json();
}

export async function createAttribute(
  data: AttributeFormData,
): Promise<Attribute> {
  const response = await fetch("/api/admin/attributes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create attribute");
  }
  return response.json();
}

export async function updateAttribute(
  id: string,
  data: Partial<AttributeFormData>,
): Promise<Attribute> {
  const response = await fetch(`/api/admin/attributes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update attribute");
  }
  return response.json();
}

export async function deleteAttribute(id: string): Promise<void> {
  const response = await fetch(`/api/admin/attributes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete attribute");
  }
}
