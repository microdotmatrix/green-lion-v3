import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminDashboard from "@/components/admin/dashboard";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminDashboardPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <AdminDashboard />
    </AdminSidebar>
  );
}
