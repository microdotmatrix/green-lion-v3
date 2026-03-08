import UsersPage from "@/components/admin/users/users-page";
import { AdminPageShell } from "@/components/admin/pages/admin-page-shell";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminUsersPage({ user }: Props) {
  return (
    <AdminPageShell>
      <UsersPage currentUserId={user.id} />
    </AdminPageShell>
  );
}
