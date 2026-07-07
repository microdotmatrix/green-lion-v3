import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { SampleRequestsResponse } from "./types";

type SampleRequestsFiltersProps = {
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusCounts: SampleRequestsResponse["statusCounts"] | undefined;
};

export function SampleRequestsFilters({
  status,
  onStatusChange,
  search,
  onSearchChange,
  statusCounts,
}: SampleRequestsFiltersProps) {
  const totalAll = Object.values(statusCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Tabs
        value={status}
        onValueChange={onStatusChange}
        className="w-full min-w-0 sm:flex-1"
      >
        <TabsList>
          <TabsTrigger value="all">All ({totalAll})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="printed">
            Printed ({statusCounts?.printed || 0})
          </TabsTrigger>
          <TabsTrigger value="packed">
            Packed ({statusCounts?.packed || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sample requests..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
