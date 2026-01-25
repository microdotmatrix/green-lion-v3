import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";

import { QuoteDetailView } from "./quote-detail-view";
import { QuotesFilters } from "./quotes-filters";
import { QuotesTable } from "./quotes-table";
import { useQuotes } from "./hooks";

export default function QuotesPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedQuoteId, setSelectedQuoteId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
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
          setStatus(value);
          setPage(1);
        }}
        search={search}
        onSearchChange={setSearch}
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
        onPageChange={setPage}
        onView={(quoteId) => setSelectedQuoteId(quoteId)}
      />
    </div>
  );
}
