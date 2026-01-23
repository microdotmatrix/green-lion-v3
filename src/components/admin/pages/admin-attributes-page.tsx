"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import AttributesPage from "@/components/admin/attributes/attributes-page";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminAttributesPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <AttributesPage />
    </AdminSidebar>
  );
}
