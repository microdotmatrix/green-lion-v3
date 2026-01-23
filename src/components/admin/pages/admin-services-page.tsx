"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import ServicesPage from "@/components/admin/content/services-page";

interface Props {
  user: { id: string; name: string; email: string; image?: string | null };
}

export function AdminServicesPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <ServicesPage />
    </AdminSidebar>
  );
}
