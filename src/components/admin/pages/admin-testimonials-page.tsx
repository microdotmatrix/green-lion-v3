"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import TestimonialsPage from "@/components/admin/content/testimonials-page";

interface Props {
  user: { id: string; name: string; email: string; image?: string | null };
}

export function AdminTestimonialsPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <TestimonialsPage />
    </AdminSidebar>
  );
}
