import AdminDashboard from "@/components/admin/dashboard";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminDashboardPage() {
  return (
    <AdminPageShell>
      <AdminDashboard />
    </AdminPageShell>
  );
}
