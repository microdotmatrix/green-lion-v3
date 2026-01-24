import AdminSidebar from "@/components/admin/admin-sidebar";
import CategoryDetailPage from "@/components/admin/categories/category-detail-page";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  categoryId: string;
}

export function AdminCategoryDetailPage({ user, categoryId }: Props) {
  return (
    <AdminSidebar user={user}>
      <CategoryDetailPage categoryId={categoryId} />
    </AdminSidebar>
  );
}
