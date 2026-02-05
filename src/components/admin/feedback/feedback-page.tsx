import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useUrlFilters } from "@/hooks/use-url-filters";

import { FeedbackDetailView } from "./feedback-detail-view";
import { FeedbackFilters } from "./feedback-filters";
import { FeedbackTable } from "./feedback-table";
import { useFeedback } from "./hooks";

const DEFAULT_PAGE = 1;
const DEFAULT_STATUS = "all";
const DEFAULT_TYPE = "all";
const FEEDBACK_STATUS_VALUES = new Set([
  "all",
  "open",
  "needs_review",
  "closed",
]);

type FeedbackFiltersState = {
  page: number;
  status: string;
  type: string;
  search: string;
};

const FEEDBACK_FILTER_SCHEMA = {
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
      FEEDBACK_STATUS_VALUES.has(value) ? value : DEFAULT_STATUS,
  },
  type: {
    param: "type",
    default: DEFAULT_TYPE,
  },
  search: { param: "search", default: "" },
} as const;

export default function FeedbackPage() {
  const { filters, setFilters } =
    useUrlFilters<FeedbackFiltersState>(FEEDBACK_FILTER_SCHEMA);
  const { page, status, type, search } = filters;
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useFeedback({
    page,
    status,
    type,
    search: debouncedSearch,
    enabled: !selectedId,
  });

  if (selectedId) {
    return (
      <FeedbackDetailView
        submissionId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Manage contact submissions and respond to customers
        </p>
      </div>

      <FeedbackFilters
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
              Failed to load feedback. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      <FeedbackTable
        data={data}
        isLoading={isLoading}
        status={status}
        debouncedSearch={debouncedSearch}
        page={page}
        onPageChange={(nextPage) =>
          setFilters((prev) => ({ ...prev, page: nextPage }))
        }
        onView={(id) => setSelectedId(id)}
      />
    </div>
  );
}
