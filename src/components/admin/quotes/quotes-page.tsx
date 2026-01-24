import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Mail,
  Package,
  Phone,
  Search,
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
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Quote {
  id: string;
  quoteNumber: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  companyName: string;
  title: string;
  estimatedTotal: string | null;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface QuoteItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  customizations: Record<string, any>;
  lineTotal: string;
  productName: string;
  productSku: string;
  productImages: string[];
  productDescription: string;
  readableCustomizations: Record<string, string>;
}

interface QuoteDetail extends Quote {
  items: QuoteItem[];
}

interface QuotesResponse {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
}

async function fetchQuotes(params: {
  page: number;
  status: string;
  search: string;
}): Promise<QuotesResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "25",
    status: params.status,
    search: params.search,
  });
  const response = await fetch(`/api/admin/quotes?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch quotes");
  return response.json();
}

async function fetchQuote(id: string): Promise<QuoteDetail> {
  const response = await fetch(`/api/admin/quotes/${id}`);
  if (!response.ok) throw new Error("Failed to fetch quote");
  return response.json();
}

async function updateQuoteStatus(id: string, status: string): Promise<Quote> {
  const response = await fetch(`/api/admin/quotes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update quote");
  return response.json();
}

function formatCurrency(value: string | null) {
  if (!value) return "—";
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function QuoteStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    pending: "secondary",
    reviewed: "default",
    quoted: "outline",
    closed: "destructive",
  };

  return (
    <Badge variant={variants[status] || "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}

function QuoteDetailView({
  quoteId,
  onBack,
}: {
  quoteId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    data: quote,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-quote", quoteId],
    queryFn: () => fetchQuote(quoteId),
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => updateQuoteStatus(quoteId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
    },
  });

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
      {/* Header */}
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
        {/* Customer Info */}
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
                onValueChange={(status) => updateMutation.mutate(status)}
                disabled={updateMutation.isPending}
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

        {/* Quote Items */}
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
                <p className="text-sm text-muted-foreground">Estimated Total</p>
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-quotes", page, status, debouncedSearch],
    queryFn: () => fetchQuotes({ page, status, search: debouncedSearch }),
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

  const totalAll = Object.values(data?.statusCounts || {}).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
        <p className="text-muted-foreground">
          Manage quote requests from customers
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          className="flex-1"
        >
          <TabsList>
            <TabsTrigger value="all">All ({totalAll})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({data?.statusCounts?.pending || 0})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({data?.statusCounts?.reviewed || 0})
            </TabsTrigger>
            <TabsTrigger value="quoted">
              Quoted ({data?.statusCounts?.quoted || 0})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed ({data?.statusCounts?.closed || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load quotes. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quotes Table */}
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
                          <p className="font-medium">
                            {quote.quoteNumber || `#${quote.id.slice(0, 8)}`}
                          </p>
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
                          onClick={() => setSelectedQuoteId(quote.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
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
    </div>
  );
}
