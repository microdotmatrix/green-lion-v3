import SampleRequestsPage from "@/components/admin/sample-requests/sample-requests-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminSampleRequestsPage() {
  return (
    <AdminPageShell>
      <SampleRequestsPage />
    </AdminPageShell>
  );
}
