import TeamMembersPage from "@/components/admin/content/team-members-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminTeamMembersPage() {
  return (
    <AdminPageShell>
      <TeamMembersPage />
    </AdminPageShell>
  );
}
