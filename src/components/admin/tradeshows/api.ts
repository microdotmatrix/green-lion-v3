import type {
  RepFormData,
  TradeshowData,
  TradeshowRep,
  TradeshowRepDetail,
} from "./types";

export async function fetchReps(): Promise<TradeshowRep[]> {
  const response = await fetch("/api/admin/tradeshows");
  if (!response.ok) throw new Error("Failed to fetch reps");
  return response.json();
}

export async function fetchTradeshowData(): Promise<TradeshowData> {
  const response = await fetch("/api/admin/tradeshows/data");
  if (!response.ok) throw new Error("Failed to fetch tradeshow data");
  return response.json();
}

export async function fetchRep(id: string): Promise<TradeshowRepDetail> {
  const response = await fetch(`/api/admin/tradeshows/${id}`);
  if (!response.ok) throw new Error("Failed to fetch rep");
  return response.json();
}

export async function createRep(data: RepFormData): Promise<TradeshowRep> {
  const response = await fetch("/api/admin/tradeshows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create rep");
  }
  return response.json();
}

export async function updateRep(
  id: string,
  data: Partial<RepFormData>,
): Promise<TradeshowRep> {
  const response = await fetch(`/api/admin/tradeshows/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update rep");
  }
  return response.json();
}

export async function deleteRep(id: string): Promise<void> {
  const response = await fetch(`/api/admin/tradeshows/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete rep");
  }
}
