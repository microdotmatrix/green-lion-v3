import AdminSidebar from "@/components/admin/admin-sidebar";
import FeedbackPage from "@/components/admin/feedback/feedback-page";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminFeedbackPage({ user }: Props) {
  return (
    <AdminSidebar user={user}>
      <FeedbackPage />
    </AdminSidebar>
  );
}
