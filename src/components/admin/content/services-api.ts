import type { Service, ServiceFormData } from "./services-types";

export async function fetchServices(): Promise<Service[]> {
  const res = await fetch("/api/admin/services");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function createService(data: ServiceFormData) {
  const res = await fetch("/api/admin/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function updateService(id: string, data: Partial<ServiceFormData>) {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function deleteService(id: string) {
  const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed");
}
