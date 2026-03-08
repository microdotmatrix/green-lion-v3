import ClientsPage from "@/components/admin/content/clients-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminClientsPage() {
  return (
    <AdminPageShell>
      <ClientsPage />
    </AdminPageShell>
  );
}
