import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  sampleStatuses,
  sampleStatusLabels,
  type SampleList,
} from "@/lib/inbound-samples";
import { sampleDate, sampleRequest } from "./api";
import { SampleFormDialog } from "./sample-form-dialog";

export function SampleListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") !== "1") return;
    setIsCreateOpen(true);
    url.searchParams.delete("new");
    window.history.replaceState(window.history.state, "", url);
  }, []);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    approval: "all",
    page: 1,
  });
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((current) => ({ ...current, search, page: 1 })),
      250,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ["inbound-samples", filters],
    queryFn: ({ signal }) =>
      sampleRequest<SampleList>(
        `?${new URLSearchParams({ ...filters, page: String(filters.page) })}`,
        { signal },
      ),
  });
  const filtered =
    filters.search || filters.status !== "all" || filters.approval !== "all";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbound Samples</h1>
          <p className="text-muted-foreground">
            Receive manufacturer samples, track testing, and record final
            approval.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>New Sample</Button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field className="sm:max-w-md">
          <FieldLabel htmlFor="sample-search">Search samples</FieldLabel>
          <Input
            id="sample-search"
            placeholder="Manufacturer or part number"
            maxLength={200}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <Field className="sm:w-52">
          <FieldLabel htmlFor="sample-status-filter">Testing status</FieldLabel>
          <Select
            value={filters.status}
            onValueChange={(status) =>
              setFilters((current) => ({ ...current, status, page: 1 }))
            }
          >
            <SelectTrigger id="sample-status-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All statuses</SelectItem>
                {sampleStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {sampleStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field className="sm:w-48">
          <FieldLabel htmlFor="sample-approval-filter">
            Final approval
          </FieldLabel>
          <Select
            value={filters.approval}
            onValueChange={(approval) =>
              setFilters((current) => ({ ...current, approval, page: 1 }))
            }
          >
            <SelectTrigger id="sample-approval-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All decisions</SelectItem>
                <SelectItem value="pending">Awaiting decision</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="not_approved">Not approved</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      {query.isPending ? (
        <div
          className="flex flex-col gap-3"
          role="status"
          aria-label="Loading samples"
        >
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-20 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load samples</AlertTitle>
          <AlertDescription>
            {query.error.message}
            <Button
              variant="outline"
              className="mt-3 w-fit"
              onClick={() => query.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : query.data.samples.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>
              {filtered ? "No matching samples" : "No inbound samples yet"}
            </EmptyTitle>
            <EmptyDescription>
              {filtered
                ? "Try another manufacturer, part number, or filter."
                : "Record the first device you receive from a manufacturer. Add its photo and basic specs, then track evaluation here."}
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            New Sample
          </Button>
        </Empty>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Specifications</TableHead>
                  <TableHead>Testing status</TableHead>
                  <TableHead>Final approval</TableHead>
                  <TableHead>Received / uploaded by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.samples.map((sample) => (
                  <TableRow key={sample.id}>
                    <TableCell>
                      <a
                        className="flex items-center gap-3 rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                        href={`/admin/inbound-samples/${sample.id}`}
                      >
                        {sample.imageUrl ? (
                          <img
                            src={sample.imageUrl}
                            alt=""
                            loading="lazy"
                            className="size-14 rounded-md border object-contain"
                          />
                        ) : (
                          <span className="flex size-14 items-center justify-center rounded-md border text-center text-xs text-muted-foreground">
                            No photo
                          </span>
                        )}
                        <span>
                          <span className="block font-medium">
                            {sample.partNumber}
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            {sample.manufacturer}
                          </span>
                        </span>
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="block">
                        {sample.capacity || "Capacity not recorded"}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {sample.voltage || "Voltage not recorded"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {sampleStatusLabels[sample.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sample.approved === true ? "default" : "outline"
                        }
                      >
                        {sample.approved === null
                          ? "Awaiting decision"
                          : sample.approved
                            ? "Approved"
                            : "Not approved"}
                      </Badge>
                      {sample.reviewerName && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {sample.reviewerName}
                          {sample.reviewedAt
                            ? ` · ${sampleDate(sample.reviewedAt)}`
                            : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="block">
                        {sampleDate(sample.createdAt)}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {sample.uploaderName}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {query.data.pagination.total} sample
              {query.data.pagination.total === 1 ? "" : "s"} · Page{" "}
              {filters.page} of {Math.max(1, query.data.pagination.totalPages)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={filters.page >= query.data.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      <SampleFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
