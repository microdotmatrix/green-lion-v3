import { ChevronLeft, ChevronRight, Clock, Eye, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { QuoteStatusBadge } from "./quote-status-badge";
import type { QuotesResponse } from "./types";
import { formatCurrency, formatDate } from "./utils";

type QuotesTableProps = {
  data: QuotesResponse | undefined;
  isLoading: boolean;
  status: string;
  debouncedSearch: string;
  page: number;
  onPageChange: (page: number) => void;
  onView: (quoteId: string) => void;
};

export function QuotesTable({
  data,
  isLoading,
  status,
  debouncedSearch,
  page,
  onPageChange,
  onView,
}: QuotesTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data?.quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No quotes found</h3>
            <p className="text-muted-foreground">
              {debouncedSearch || status !== "all"
                ? "Try adjusting your filters"
                : "Quote requests will appear here"}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div>
                        <button
                          type="button"
                          className="font-medium text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:underline"
                          onClick={() => onView(quote.id)}
                        >
                          {quote.quoteNumber || `#${quote.id.slice(0, 8)}`}
                        </button>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(quote.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {quote.firstName} {quote.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quote.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{quote.companyName}</TableCell>
                    <TableCell className="text-center">
                      {quote.itemCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(quote.estimatedTotal)}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(quote.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data && data.pagination.totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
