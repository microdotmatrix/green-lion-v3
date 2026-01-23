"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import CaseStudiesPage from "@/components/admin/content/case-studies-page";

interface Props {
  user: { id: string; name: string; email: string; image?: string | null };
}

export function AdminCaseStudiesPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <CaseStudiesPage />
    </AdminSidebar>
  );
}
