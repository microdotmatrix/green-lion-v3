"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import ClientsPage from "@/components/admin/content/clients-page";

interface Props {
  user: { id: string; name: string; email: string; image?: string | null };
}

export function AdminClientsPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <ClientsPage />
    </AdminSidebar>
  );
}
