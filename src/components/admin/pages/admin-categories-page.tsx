"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import CategoriesPage from "@/components/admin/categories/categories-page";

interface AdminCategoriesPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminCategoriesPage({ user }: AdminCategoriesPageProps) {
  return (
    <AdminLayout user={user}>
      <CategoriesPage />
    </AdminLayout>
  );
}
