import { Download, X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { LeadWithRep, TradeshowRepWithSelections } from "./types";
import { formatDate } from "./utils";

type LeadSubmissionsProps = {
  leads: LeadWithRep[];
  reps: TradeshowRepWithSelections[];
  onDeleteLead?: (leadId: string) => void;
};

const contactMethodLabels: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  gmail: "Gmail",
  applemail: "Apple Mail",
  otheremail: "Other Email",
};

export const LeadSubmissions = ({
  leads,
  reps,
  onDeleteLead,
}: LeadSubmissionsProps) => {
  const [selectedRepId, setSelectedRepId] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<string>("all");

  const filteredLeads = React.useMemo(() => {
    let filtered = leads;

    if (selectedRepId !== "all") {
      filtered = filtered.filter((lead) => lead.repId === selectedRepId);
    }

    if (dateRange !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(
        (lead) => new Date(lead.createdAt) >= startDate,
      );
    }

    return filtered;
  }, [leads, selectedRepId, dateRange]);

  const handleExportCsv = () => {
    const headers = [
      "Lead Name",
      "Company",
      "Interests",
      "Contact Method",
      "Rep Name",
      "Date Submitted",
    ];

    const rows = filteredLeads.map((lead) => {
      const interestCount =
        lead.selectedCategoryIds.length +
        lead.selectedProductIds.length +
        lead.selectedServiceIds.length;
      return [
        lead.leadName,
        lead.leadCompany || "",
        `${interestCount} item${interestCount !== 1 ? "s" : ""} selected`,
        contactMethodLabels[lead.contactMethod] || lead.contactMethod,
        lead.repName,
        formatDate(lead.createdAt),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tradeshow-leads-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Lead Submissions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleExportCsv}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              Filter by Rep
            </label>
            <Select value={selectedRepId} onValueChange={setSelectedRepId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Reps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {reps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              Filter by Date Range
            </label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No leads found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Interests</TableHead>
                  <TableHead>Contact Method</TableHead>
                  <TableHead>Rep Name</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const interestCount =
                    lead.selectedCategoryIds.length +
                    lead.selectedProductIds.length +
                    lead.selectedServiceIds.length;
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.leadName}
                      </TableCell>
                      <TableCell>{lead.leadCompany || "—"}</TableCell>
                      <TableCell>
                        <span className="text-green-600">
                          {interestCount} item{interestCount !== 1 ? "s" : ""}{" "}
                          selected
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contactMethodLabels[lead.contactMethod] ||
                            lead.contactMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.repName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell>
                        {onDeleteLead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteLead(lead.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground mt-4">
              Showing {filteredLeads.length} of {leads.length} total leads
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
