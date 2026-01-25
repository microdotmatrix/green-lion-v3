import type { CreateInviteResponse, Invite, User } from "./types";

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchInvites(): Promise<Invite[]> {
  const res = await fetch("/api/admin/invites");
  if (!res.ok) throw new Error("Failed to fetch invites");
  return res.json();
}

export async function createInvite(
  email: string,
): Promise<CreateInviteResponse> {
  const res = await fetch("/api/admin/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create invite");
  }
  return res.json();
}

export async function revokeInvite(id: string) {
  const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to revoke invite");
  }
}

export async function deleteUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete user");
  }
}

export async function toggleVerified(id: string, verified: boolean) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailVerified: verified }),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function toggleApproved(id: string, approved: boolean) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}
