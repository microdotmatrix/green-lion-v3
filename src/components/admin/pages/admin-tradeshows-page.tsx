import AdminSidebar from "@/components/admin/admin-sidebar";
import TradeshowsPage from "@/components/admin/tradeshows/tradeshows-page";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminTradeshowsPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <TradeshowsPage />
    </AdminSidebar>
  );
}
