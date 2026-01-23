"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import TradeshowsPage from "@/components/admin/tradeshows/tradeshows-page";

interface AdminTradeshowsPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminTradeshowsPage({ user }: AdminTradeshowsPageProps) {
  return (
    <AdminLayout user={user}>
      <TradeshowsPage />
    </AdminLayout>
  );
}
