import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { FeedbackResponse } from "./types";

type FeedbackFiltersProps = {
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusCounts: FeedbackResponse["statusCounts"] | undefined;
};

export function FeedbackFilters({
  status,
  onStatusChange,
  search,
  onSearchChange,
  statusCounts,
}: FeedbackFiltersProps) {
  const totalAll = Object.values(statusCounts || {}).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="flex items-center gap-4">
      <Tabs value={status} onValueChange={onStatusChange} className="flex-1">
        <TabsList>
          <TabsTrigger value="all">All ({totalAll})</TabsTrigger>
          <TabsTrigger value="open">
            Open ({statusCounts?.open || 0})
          </TabsTrigger>
          <TabsTrigger value="needs_review">
            Needs Review ({statusCounts?.needs_review || 0})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({statusCounts?.closed || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search feedback..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
