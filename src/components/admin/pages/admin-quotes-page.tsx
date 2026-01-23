"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import QuotesPage from "@/components/admin/quotes/quotes-page";

interface AdminQuotesPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminQuotesPage({ user }: AdminQuotesPageProps) {
  return (
    <AdminLayout user={user}>
      <QuotesPage />
    </AdminLayout>
  );
}
