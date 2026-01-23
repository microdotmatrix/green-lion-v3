"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import AdminDashboard from "@/components/admin/dashboard";

interface AdminDashboardPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminDashboardPage({ user }: AdminDashboardPageProps) {
  return (
    <AdminLayout user={user}>
      <AdminDashboard />
    </AdminLayout>
  );
}
