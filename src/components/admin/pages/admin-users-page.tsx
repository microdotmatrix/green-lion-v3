"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import UsersPage from "@/components/admin/users/users-page";

interface Props {
  user: { id: string; name: string; email: string; image?: string | null };
}

export function AdminUsersPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <UsersPage currentUserId={user.id} />
    </AdminSidebar>
  );
}
