"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import ProductsPage from "@/components/admin/products/products-page";

interface AdminProductsPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminProductsPage({ user }: AdminProductsPageProps) {
  return (
    <AdminLayout user={user}>
      <ProductsPage />
    </AdminLayout>
  );
}
