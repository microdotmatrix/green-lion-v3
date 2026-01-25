import type { ClientFormData, ClientLogo } from "./clients-types";

export async function fetchClients(): Promise<ClientLogo[]> {
  const res = await fetch("/api/admin/clients");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function createClient(data: ClientFormData) {
  const res = await fetch("/api/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function updateClient(id: string, data: Partial<ClientFormData>) {
  const res = await fetch(`/api/admin/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function deleteClient(id: string) {
  const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed");
}
