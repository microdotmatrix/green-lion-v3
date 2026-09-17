import { AdminPageShell } from "./admin-page-shell";
import { SampleListPage } from "@/components/admin/inbound-samples/sample-list";
import { SampleDetailPage } from "@/components/admin/inbound-samples/sample-editor";

export function AdminInboundSamplesPage() {
  return (
    <AdminPageShell>
      <SampleListPage />
    </AdminPageShell>
  );
}

export function AdminInboundSampleDetailPage(props: {
  sampleId?: string;
  reviewerName: string;
}) {
  return (
    <AdminPageShell>
      <SampleDetailPage {...props} />
    </AdminPageShell>
  );
}
