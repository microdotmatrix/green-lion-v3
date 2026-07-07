import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUrlFilters } from "@/hooks/use-url-filters";

import { DeleteSampleRequestDialog } from "./delete-sample-request-dialog";
import { SampleRequestDetailView } from "./sample-request-detail-view";
import { SampleRequestFormDialog } from "./sample-request-form-dialog";
import { SampleRequestsFilters } from "./sample-requests-filters";
import { SampleRequestsTable } from "./sample-requests-table";
import { useSampleRequestMutations, useSampleRequests } from "./hooks";
import type { SampleRequestListItem } from "./types";

const DEFAULT_PAGE = 1;
const DEFAULT_STATUS = "all";
const SAMPLE_REQUEST_STATUS_VALUES = new Set([
  "all",
  "pending",
  "printed",
  "packed",
]);

type SampleRequestFilters = {
  page: number;
  status: string;
  search: string;
};

const SAMPLE_REQUESTS_FILTER_SCHEMA = {
  page: {
    param: "page",
    default: DEFAULT_PAGE,
    parse: (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
    },
    serialize: (value: number) => (value > DEFAULT_PAGE ? String(value) : null),
  },
  status: {
    param: "status",
    default: DEFAULT_STATUS,
    parse: (value: string) =>
      SAMPLE_REQUEST_STATUS_VALUES.has(value) ? value : DEFAULT_STATUS,
  },
  search: { param: "search", default: "" },
} as const;

export default function SampleRequestsPage() {
  const { filters, setFilters } = useUrlFilters<SampleRequestFilters>(
    SAMPLE_REQUESTS_FILTER_SCHEMA,
  );
  const { page, status, search } = filters;
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [selectedRequestId, setSelectedRequestId] = React.useState<
    string | null
  >(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<SampleRequestListItem | null>(null);

  const { deleteMut } = useSampleRequestMutations();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useSampleRequests({
    page,
    status,
    search: debouncedSearch,
    enabled: !selectedRequestId,
  });

  if (selectedRequestId) {
    return (
      <SampleRequestDetailView
        requestId={selectedRequestId}
        onBack={() => setSelectedRequestId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sample Requests</h1>
          <p className="text-muted-foreground">
            Create sample requests and print thermal labels for sample bags
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Sample Request
        </Button>
      </div>

      <SampleRequestsFilters
        status={status}
        onStatusChange={(value) => {
          setFilters((prev) => ({
            ...prev,
            status: value,
            page: DEFAULT_PAGE,
          }));
        }}
        search={search}
        onSearchChange={(value) =>
          setFilters((prev) => ({
            ...prev,
            search: value,
            page: DEFAULT_PAGE,
          }))
        }
        statusCounts={data?.statusCounts}
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load sample requests. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      <SampleRequestsTable
        data={data}
        isLoading={isLoading}
        status={status}
        debouncedSearch={debouncedSearch}
        page={page}
        onPageChange={(nextPage) =>
          setFilters((prev) => ({ ...prev, page: nextPage }))
        }
        onView={(id) => setSelectedRequestId(id)}
        onDelete={(request) => setDeleteTarget(request)}
      />

      <SampleRequestFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => setIsCreateOpen(false)}
      />

      <DeleteSampleRequestDialog
        request={deleteTarget}
        isDeleting={deleteMut.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDelete={(id) => {
          deleteMut.mutate(id, {
            onSettled: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
  );
}
