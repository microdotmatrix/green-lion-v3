import TradeshowsPage from "@/components/admin/tradeshows/tradeshows-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminTradeshowsPage() {
  return (
    <AdminPageShell>
      <TradeshowsPage />
    </AdminPageShell>
  );
}
