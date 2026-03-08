import CategoriesPage from "@/components/admin/categories/categories-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminCategoriesPage() {
  return (
    <AdminPageShell>
      <CategoriesPage />
    </AdminPageShell>
  );
}
