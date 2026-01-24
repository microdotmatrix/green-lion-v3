import AdminSidebar from "@/components/admin/admin-sidebar";
import CategoriesPage from "@/components/admin/categories/categories-page";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminCategoriesPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <CategoriesPage />
    </AdminSidebar>
  );
}
