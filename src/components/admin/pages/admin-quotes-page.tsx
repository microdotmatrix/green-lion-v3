import QuotesPage from "@/components/admin/quotes/quotes-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminQuotesPage() {
  return (
    <AdminPageShell>
      <QuotesPage />
    </AdminPageShell>
  );
}
