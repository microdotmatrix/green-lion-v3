import AdminSidebar from "@/components/admin/admin-sidebar";
import ProductsPage from "@/components/admin/products/products-page";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminProductsPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <ProductsPage />
    </AdminSidebar>
  );
}
