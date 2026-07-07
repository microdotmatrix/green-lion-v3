import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useSampleRequestDetail, useSampleRequestMutations } from "./hooks";
import { SampleRequestStatusBadge } from "./sample-request-status-badge";
import { SAMPLE_REQUEST_STATUSES, formatAddress, formatDate } from "./utils";

type SampleRequestDetailViewProps = {
  requestId: string;
  onBack: () => void;
};

export function SampleRequestDetailView({
  requestId,
  onBack,
}: SampleRequestDetailViewProps) {
  const {
    data: request,
    isLoading,
    error,
  } = useSampleRequestDetail(requestId, !!requestId);
  const { updateStatusMut } = useSampleRequestMutations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <p className="text-destructive">
            Failed to load sample request details.
          </p>
          <Button variant="outline" onClick={onBack} className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sample Requests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">
            {request.requestNumber || `Request #${request.id.slice(0, 8)}`}
          </h1>
          <p className="text-muted-foreground">
            Created {formatDate(request.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SampleRequestStatusBadge status={request.status} />
          <Button asChild>
            <a
              href={`/admin/sample-requests/${request.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Recipient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{request.recipientName}</p>
              {request.companyName && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4" />
                  {request.companyName}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              {request.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${request.email}`}
                    className="text-primary hover:underline"
                  >
                    {request.email}
                  </a>
                </div>
              )}
              {request.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${request.phone}`}
                    className="text-primary hover:underline"
                  >
                    {request.phone}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {formatAddress(request).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
            {request.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{request.notes}</p>
                </div>
              </>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Select
                value={request.status}
                onValueChange={(status) =>
                  updateStatusMut.mutate({ id: requestId, status })
                }
                disabled={updateStatusMut.isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_REQUEST_STATUSES.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Sample Items</CardTitle>
            <CardDescription>
              {request.items.length}{" "}
              {request.items.length === 1 ? "item" : "items"} — one label per
              item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {request.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.capacity || "—"}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
