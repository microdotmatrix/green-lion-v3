import AdminSidebar from "@/components/admin/admin-sidebar";
import QuotesPage from "@/components/admin/quotes/quotes-page";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminQuotesPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <QuotesPage />
    </AdminSidebar>
  );
}
