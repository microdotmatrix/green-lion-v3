import {
  ArrowLeft,
  Building2,
  Mail,
  Package,
  Phone,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
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

import { useQuoteDetail, useQuoteMutations } from "./hooks";
import { QuoteStatusBadge } from "./quote-status-badge";
import { formatCurrency, formatDate } from "./utils";

type QuoteDetailViewProps = {
  quoteId: string;
  onBack: () => void;
};

export function QuoteDetailView({ quoteId, onBack }: QuoteDetailViewProps) {
  const { data: quote, isLoading, error } = useQuoteDetail(quoteId, !!quoteId);
  const { updateStatusMut } = useQuoteMutations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <p className="text-destructive">Failed to load quote details.</p>
          <Button variant="outline" onClick={onBack} className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {quote.quoteNumber || `Quote #${quote.id.slice(0, 8)}`}
          </h1>
          <p className="text-muted-foreground">
            Created {formatDate(quote.createdAt)}
          </p>
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                {quote.firstName} {quote.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{quote.title}</p>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {quote.companyName}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${quote.email}`}
                  className="text-primary hover:underline"
                >
                  {quote.email}
                </a>
              </div>
              {quote.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${quote.phone}`}
                    className="text-primary hover:underline"
                  >
                    {quote.phone}
                  </a>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Select
                value={quote.status}
                onValueChange={(status) =>
                  updateStatusMut.mutate({ id: quoteId, status })
                }
                disabled={updateStatusMut.isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quote Items</CardTitle>
            <CardDescription>{quote.items.length} items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quote.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-lg border">
                  {item.productImages?.[0] ? (
                    <img
                      src={item.productImages[0]}
                      alt={item.productName}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.productSku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(item.lineTotal)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                    {Object.keys(item.readableCustomizations).length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Customizations:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.readableCustomizations).map(
                            ([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {key}: {value}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Estimated Total
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(quote.estimatedTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
