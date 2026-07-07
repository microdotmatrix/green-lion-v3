import type {
  ProductAttributeAssignment,
  ProductSearchResult,
  SampleRequestDetail,
  SampleRequestFormData,
  SampleRequestsResponse,
} from "./types";

export async function fetchSampleRequests(params: {
  page: number;
  status: string;
  search: string;
}): Promise<SampleRequestsResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "25",
    status: params.status,
    search: params.search,
  });
  const response = await fetch(`/api/admin/sample-requests?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch sample requests");
  return response.json();
}

export async function fetchSampleRequest(
  id: string,
): Promise<SampleRequestDetail> {
  const response = await fetch(`/api/admin/sample-requests/${id}`);
  if (!response.ok) throw new Error("Failed to fetch sample request");
  return response.json();
}

export async function createSampleRequest(
  data: SampleRequestFormData,
): Promise<{ id: string; requestNumber: string | null; status: string }> {
  const response = await fetch("/api/admin/sample-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      items: data.items.map((item) => ({
        productId: item.productId,
        capacity: item.capacity || undefined,
        quantity: item.quantity,
      })),
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to create sample request");
  }
  const result = await response.json();
  return result.sampleRequest;
}

export async function updateSampleRequestStatus(
  id: string,
  status: string,
): Promise<SampleRequestDetail> {
  const response = await fetch(`/api/admin/sample-requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update sample request");
  return response.json();
}

export async function deleteSampleRequest(id: string): Promise<void> {
  const response = await fetch(`/api/admin/sample-requests/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete sample request");
}

export async function searchProducts(
  search: string,
): Promise<ProductSearchResult[]> {
  const searchParams = new URLSearchParams({
    page: "1",
    limit: "20",
    search,
  });
  const response = await fetch(`/api/admin/products?${searchParams}`);
  if (!response.ok) throw new Error("Failed to search products");
  const result = await response.json();
  return result.products.map(
    (p: {
      id: string;
      sku: string;
      name: string;
      categoryName: string | null;
    }) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryName: p.categoryName,
    }),
  );
}

// Capacity is modeled through the generic attribute system: an operator-defined
// "Capacity" customization attribute assigned to a product. Returns the option
// values the product supports, or null if the product has no capacity attribute.
export async function fetchProductCapacityOptions(
  productId: string,
): Promise<string[] | null> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`);
  if (!response.ok) throw new Error("Failed to fetch product attributes");
  const assignments: ProductAttributeAssignment[] = await response.json();
  const capacityAttribute = assignments.find(
    (assignment) => assignment.attributeName.toLowerCase() === "capacity",
  );
  if (!capacityAttribute) return null;
  const options = capacityAttribute.supportedOptions?.length
    ? capacityAttribute.supportedOptions
    : (capacityAttribute.allOptions ?? []);
  return options;
}
