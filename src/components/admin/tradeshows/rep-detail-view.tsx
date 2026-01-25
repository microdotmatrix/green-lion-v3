import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
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

import { useTradeshowRep } from "./hooks";
import { formatDate } from "./utils";

type RepDetailViewProps = {
  repId: string;
  onBack: () => void;
};

export function RepDetailView({ repId, onBack }: RepDetailViewProps) {
  const [copied, setCopied] = React.useState(false);

  const { data: rep, isLoading, error } = useTradeshowRep(repId, !!repId);

  const handleCopyUrl = () => {
    if (!rep?.slug) return;
    const url = `${window.location.origin}/leads/${rep.slug}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !rep) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <p className="text-destructive">Failed to load rep details.</p>
          <Button variant="outline" onClick={onBack} className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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
          <h1 className="text-2xl font-bold">{rep.name}</h1>
          <p className="text-muted-foreground">{rep.company}</p>
        </div>
        <Badge variant={rep.active ? "default" : "secondary"}>
          {rep.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p>{rep.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{rep.phone}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Lead Capture URL</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  /leads/{rep.slug}
                </code>
                <Button variant="ghost" size="icon" onClick={handleCopyUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={`/leads/${rep.slug}`} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{rep.leads?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Captured Leads</CardTitle>
            <CardDescription>Leads captured by this representative</CardDescription>
          </CardHeader>
          <CardContent>
            {rep.leads?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads captured yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rep.leads?.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.leadName}
                      </TableCell>
                      <TableCell>{lead.leadCompany || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lead.contactMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
