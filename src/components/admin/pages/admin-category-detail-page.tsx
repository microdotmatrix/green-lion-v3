import CategoryDetailPage from "@/components/admin/categories/category-detail-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

interface Props {
  categoryId: string;
}

export function AdminCategoryDetailPage({ categoryId }: Props) {
  return (
    <AdminPageShell>
      <CategoryDetailPage categoryId={categoryId} />
    </AdminPageShell>
  );
}
