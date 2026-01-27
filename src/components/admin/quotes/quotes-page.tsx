import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useUrlFilters } from "@/hooks/use-url-filters";

import { QuoteDetailView } from "./quote-detail-view";
import { QuotesFilters } from "./quotes-filters";
import { QuotesTable } from "./quotes-table";
import { useQuotes } from "./hooks";

const DEFAULT_PAGE = 1;
const DEFAULT_STATUS = "all";
const QUOTE_STATUS_VALUES = new Set([
  "all",
  "pending",
  "reviewed",
  "quoted",
  "closed",
]);

type QuoteFilters = {
  page: number;
  status: string;
  search: string;
};

const QUOTES_FILTER_SCHEMA = {
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
      QUOTE_STATUS_VALUES.has(value) ? value : DEFAULT_STATUS,
  },
  search: { param: "search", default: "" },
} as const;

export default function QuotesPage() {
  const { filters, setFilters } =
    useUrlFilters<QuoteFilters>(QUOTES_FILTER_SCHEMA);
  const { page, status, search } = filters;
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [selectedQuoteId, setSelectedQuoteId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuotes({
    page,
    status,
    search: debouncedSearch,
    enabled: !selectedQuoteId,
  });

  if (selectedQuoteId) {
    return (
      <QuoteDetailView
        quoteId={selectedQuoteId}
        onBack={() => setSelectedQuoteId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
        <p className="text-muted-foreground">
          Manage quote requests from customers
        </p>
      </div>

      <QuotesFilters
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
              Failed to load quotes. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      <QuotesTable
        data={data}
        isLoading={isLoading}
        status={status}
        debouncedSearch={debouncedSearch}
        page={page}
        onPageChange={(nextPage) =>
          setFilters((prev) => ({ ...prev, page: nextPage }))
        }
        onView={(quoteId) => setSelectedQuoteId(quoteId)}
      />
    </div>
  );
}
