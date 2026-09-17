import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  sampleEvidenceChanged,
  sampleInputSchema,
  type InboundSample,
  type SampleInput,
} from "@/lib/inbound-samples";
import { sampleDate, sampleRequest } from "./api";
import { SamplePhoto } from "./sample-photo";
import { SampleFormFields, sampleFields } from "./sample-form-fields";

export function SampleDetailPage({
  sampleId,
  reviewerName,
}: {
  sampleId?: string;
  reviewerName: string;
}) {
  const query = useQuery({
    queryKey: ["inbound-sample", sampleId],
    queryFn: () => sampleRequest<InboundSample>(`/${sampleId}`),
    enabled: !!sampleId,
  });
  if (sampleId && query.isPending)
    return (
      <div
        role="status"
        aria-label="Loading sample"
        className="flex flex-col gap-6"
      >
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (sampleId && query.isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load sample</AlertTitle>
        <AlertDescription>
          {query.error.message}
          <div className="mt-3 flex gap-3">
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/inbound-samples">Back to samples</a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  return <SampleEditor initial={query.data} reviewerName={reviewerName} />;
}

function SampleEditor({
  initial,
  reviewerName,
}: {
  initial?: InboundSample;
  reviewerName: string;
}) {
  const [sample, setSample] = useState(initial);
  const [form, setForm] = useState<SampleInput>(() => sampleFields(initial));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SampleInput, string>>
  >({});
  const queryClient = useQueryClient();
  const dirty = sampleEvidenceChanged(sampleFields(sample), form);
  const busy = saving || uploading;

  useEffect(() => {
    if (!dirty && !busy) return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [dirty, busy]);

  function setField<K extends keyof SampleInput>(
    key: K,
    value: SampleInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function persistReview(approved: boolean | null) {
    if (!sample || busy || dirty) return;
    setSaving(true);
    setError("");
    try {
      const updated = await sampleRequest<InboundSample>(
        `/${sample.id}/review`,
        {
          method: "POST",
          body: JSON.stringify({ approved, version: sample.version }),
        },
      );
      setSample(updated);
      queryClient.invalidateQueries({ queryKey: ["inbound-samples"] });
      toast.success(
        approved === null
          ? "Decision cleared"
          : approved
            ? "Sample approved"
            : "Sample marked not approved",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save the decision.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const parsed = sampleInputSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Partial<Record<keyof SampleInput, string>> = {};
      for (const issue of parsed.error.issues)
        errors[issue.path[0] as keyof SampleInput] = issue.message;
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await sampleRequest<InboundSample>(
        sample ? `/${sample.id}` : "",
        {
          method: sample ? "PUT" : "POST",
          body: JSON.stringify({
            ...parsed.data,
            ...(sample ? { version: sample.version } : {}),
          }),
        },
      );
      const wasNew = !sample;
      setSample(updated);
      setForm(sampleFields(updated));
      setFieldErrors({});
      queryClient.invalidateQueries({ queryKey: ["inbound-samples"] });
      if (wasNew)
        window.history.replaceState(
          null,
          "",
          `/admin/inbound-samples/${updated.id}`,
        );
      toast.success(wasNew ? "Sample received" : "Sample saved");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save the sample.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <Button asChild variant="link" className="px-0">
          <a href="/admin/inbound-samples">Back to inbound samples</a>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {sample ? sample.partNumber : "Receive a sample"}
        </h1>
        <p className="text-muted-foreground">
          {sample
            ? `${sample.manufacturer} · Received ${sampleDate(sample.createdAt)} by ${sample.uploaderName}`
            : "Start with the manufacturer and part number. Add a photo and specs as available."}
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not save changes</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-fit"
              onClick={() => window.location.reload()}
            >
              Reload sample
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={save} className="flex flex-col gap-8">
        <fieldset
          disabled={saving}
          className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
          <legend className="sr-only">Sample details</legend>
          <SamplePhoto
            value={form.imageUrl}
            onChange={(value) => setField("imageUrl", value)}
            onUploadingChange={setUploading}
            disabled={saving}
          />
          <FieldGroup>
            <SampleFormFields
              form={form}
              fieldErrors={fieldErrors}
              setField={setField}
              disabled={saving}
            />
            {sample?.approved !== null &&
              sample?.approved !== undefined &&
              dirty && (
                <Alert>
                  <AlertTitle>A fresh review will be needed</AlertTitle>
                  <AlertDescription>
                    Saving changes to this sample clears its previous approval
                    decision.
                  </AlertDescription>
                </Alert>
              )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy || (!!sample && !dirty)}>
                {saving
                  ? "Saving…"
                  : uploading
                    ? "Uploading photo…"
                    : sample
                      ? "Save changes"
                      : "Receive sample"}
              </Button>
              {sample && (
                <span
                  className="text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {dirty ? "Unsaved changes" : "All changes saved"}
                </span>
              )}
            </div>
          </FieldGroup>
        </fieldset>
      </form>
      <section
        aria-labelledby="final-approval"
        className="flex flex-col gap-4 border-t pt-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="final-approval" className="text-xl font-semibold">
            Final approval
          </h2>
          <Badge variant={sample?.approved === true ? "default" : "outline"}>
            {sample?.approved == null
              ? "Awaiting decision"
              : sample.approved
                ? "Approved"
                : "Not approved"}
          </Badge>
        </div>
        {sample?.reviewerName && sample.reviewedAt ? (
          <p className="text-sm">
            {sample.reviewerName}{" "}
            {sample.approved ? "approved" : "did not approve"} this sample on{" "}
            {sampleDate(sample.reviewedAt)}.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {!sample
              ? "Save the sample first."
              : dirty
                ? "Save your changes before recording a decision."
                : sample.status !== "evaluated"
                  ? "Complete testing and save the status as Evaluated to record a decision."
                  : `Your decision will be recorded as ${reviewerName}.`}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={
              !sample ||
              busy ||
              dirty ||
              sample.status !== "evaluated" ||
              sample.approved === true
            }
            onClick={() => persistReview(true)}
          >
            Yes, approve
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              !sample ||
              busy ||
              dirty ||
              sample.status !== "evaluated" ||
              sample.approved === false
            }
            onClick={() => persistReview(false)}
          >
            No, do not approve
          </Button>
          {sample?.approved != null && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy || dirty}
              onClick={() => persistReview(null)}
            >
              Clear decision
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Approved samples are ready for manual catalog entry. Full product
          specifications are added in Products.
        </p>
        {sample?.approved === true && (
          <Button asChild variant="outline" className="w-fit">
            <a href="/admin/products">Open Products</a>
          </Button>
        )}
      </section>
    </div>
  );
}
