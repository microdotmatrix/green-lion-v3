import ProductsPage from "@/components/admin/products/products-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

export function AdminProductsPage() {
  return (
    <AdminPageShell>
      <ProductsPage />
    </AdminPageShell>
  );
}
