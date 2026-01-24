import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  Clock,
  FileText,
  FolderOpen,
  Package,
  Users,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  products: number;
  categories: number;
  activeQuotes: number;
  pendingQuotes: number;
  leadsThisMonth: number;
  recentQuotes: {
    id: string;
    quoteNumber: string | null;
    firstName: string;
    lastName: string;
    companyName: string;
    status: string;
    estimatedTotal: string | null;
    createdAt: string;
  }[];
  recentLeads: {
    id: string;
    leadName: string;
    leadCompany: string | null;
    contactMethod: string;
    createdAt: string;
  }[];
}

async function fetchStats(): Promise<DashboardStats> {
  const response = await fetch("/api/admin/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
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

function formatCurrency(value: string | null) {
  if (!value) return "—";
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Green Lion admin panel
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load dashboard stats. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats?.products ?? 0}
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          title="Categories"
          value={stats?.categories ?? 0}
          icon={FolderOpen}
          loading={isLoading}
        />
        <StatCard
          title="Active Quotes"
          value={stats?.activeQuotes ?? 0}
          description={`${stats?.pendingQuotes ?? 0} pending review`}
          icon={FileText}
          loading={isLoading}
        />
        <StatCard
          title="Leads This Month"
          value={stats?.leadsThisMonth ?? 0}
          icon={Users}
          loading={isLoading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Quotes</CardTitle>
                <CardDescription>Latest quote requests</CardDescription>
              </div>
              <a
                href="/admin/quotes"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.recentQuotes?.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No quote requests yet
              </p>
            ) : (
              <div className="space-y-4">
                {stats?.recentQuotes?.map((quote) => (
                  <a
                    key={quote.id}
                    href={`/admin/quotes/${quote.id}`}
                    className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {quote.firstName} {quote.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {quote.companyName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(quote.estimatedTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(quote.createdAt)}
                        </p>
                      </div>
                      <QuoteStatusBadge status={quote.status} />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest trade show leads</CardDescription>
              </div>
              <a
                href="/admin/tradeshows"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.recentLeads?.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No leads captured yet
              </p>
            ) : (
              <div className="space-y-4">
                {stats?.recentLeads?.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {lead.leadName}
                      </p>
                      {lead.leadCompany && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {lead.leadCompany}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">
                        {lead.contactMethod}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
