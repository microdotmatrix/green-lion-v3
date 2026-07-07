import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  PackageOpen,
  Printer,
  Trash2,
} from "lucide-react";

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

import { SampleRequestStatusBadge } from "./sample-request-status-badge";
import type { SampleRequestListItem, SampleRequestsResponse } from "./types";
import { formatDate } from "./utils";

type SampleRequestsTableProps = {
  data: SampleRequestsResponse | undefined;
  isLoading: boolean;
  status: string;
  debouncedSearch: string;
  page: number;
  onPageChange: (page: number) => void;
  onView: (id: string) => void;
  onDelete: (request: SampleRequestListItem) => void;
};

export function SampleRequestsTable({
  data,
  isLoading,
  status,
  debouncedSearch,
  page,
  onPageChange,
  onView,
  onDelete,
}: SampleRequestsTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data?.sampleRequests.length === 0 ? (
          <div className="text-center py-12">
            <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No sample requests found
            </h3>
            <p className="text-muted-foreground">
              {debouncedSearch || status !== "all"
                ? "Try adjusting your filters"
                : "Create a sample request to print labels"}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.sampleRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <button
                          type="button"
                          className="font-medium text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:underline"
                          onClick={() => onView(request.id)}
                        >
                          {request.requestNumber ||
                            `#${request.id.slice(0, 8)}`}
                        </button>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{request.recipientName}</TableCell>
                    <TableCell>{request.companyName || "—"}</TableCell>
                    <TableCell className="text-center">
                      {request.itemCount}
                    </TableCell>
                    <TableCell>
                      <SampleRequestStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(request.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`/admin/sample-requests/${request.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(request)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
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
