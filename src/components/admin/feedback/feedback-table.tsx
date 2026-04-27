import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  MessageSquare,
  MessageSquareText,
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

import { FeedbackStatusBadge } from "./feedback-status-badge";
import { FeedbackTypeBadge } from "./feedback-type-badge";
import type { FeedbackResponse } from "./types";
import { formatDate } from "./utils";

type FeedbackTableProps = {
  data: FeedbackResponse | undefined;
  isLoading: boolean;
  status: string;
  debouncedSearch: string;
  page: number;
  onPageChange: (page: number) => void;
  onView: (id: string) => void;
};

export function FeedbackTable({
  data,
  isLoading,
  status,
  debouncedSearch,
  page,
  onPageChange,
  onView,
}: FeedbackTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data?.submissions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No submissions found</h3>
            <p className="text-muted-foreground">
              {debouncedSearch || status !== "all"
                ? "Try adjusting your filters"
                : "Contact submissions will appear here"}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Replies</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.submissions.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <button
                          type="button"
                          className="font-medium text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:underline"
                          onClick={() => onView(ticket.id)}
                        >
                          {ticket.title}
                        </button>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {ticket.firstName} {ticket.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.companyName}</TableCell>
                    <TableCell>
                      <FeedbackTypeBadge type={ticket.type} />
                    </TableCell>
                    <TableCell>
                      <FeedbackStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {ticket.replyCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
                          {ticket.replyCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(ticket.id)}
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
