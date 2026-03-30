import type { TeamMember, TeamMemberFormData } from "./team-members-types";

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const res = await fetch("/api/admin/team-members");
  if (!res.ok) throw new Error("Failed to fetch team members");
  return res.json();
}

export async function createTeamMember(
  data: TeamMemberFormData,
): Promise<TeamMember> {
  const res = await fetch("/api/admin/team-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to create team member");
  }
  return res.json();
}

export async function updateTeamMember(
  id: string,
  data: Partial<TeamMemberFormData>,
): Promise<TeamMember> {
  const res = await fetch(`/api/admin/team-members/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to update team member");
  }
  return res.json();
}

export async function deleteTeamMember(id: string): Promise<void> {
  const res = await fetch(`/api/admin/team-members/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to delete team member");
  }
}
