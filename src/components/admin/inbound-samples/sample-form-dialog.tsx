import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import {
  sampleEvidenceChanged,
  sampleInputSchema,
  type InboundSample,
  type SampleInput,
} from "@/lib/inbound-samples";
import { sampleRequest } from "./api";
import { SampleFormFields, sampleFields } from "./sample-form-fields";
import { SamplePhoto } from "./sample-photo";

export function SampleFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<SampleInput>(() => sampleFields());
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SampleInput, string>>
  >({});
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (input: SampleInput) =>
      sampleRequest<InboundSample>("", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-samples"] });
      setForm(sampleFields());
      setFieldErrors({});
      onOpenChange(false);
      toast.success("Sample received");
    },
  });
  const busy = uploading || createMutation.isPending;
  const dirty = sampleEvidenceChanged(sampleFields(), form);

  useEffect(() => {
    if (!open || (!dirty && !busy)) return;
    const preventLoss = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [open, dirty, busy]);

  function changeOpen(nextOpen: boolean) {
    if (busy) return;
    if (!nextOpen) {
      setForm(sampleFields());
      setFieldErrors({});
      createMutation.reset();
    }
    onOpenChange(nextOpen);
  }

  function setField<K extends keyof SampleInput>(
    key: K,
    value: SampleInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const parsed = sampleInputSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Partial<Record<keyof SampleInput, string>> = {};
      for (const issue of parsed.error.issues)
        errors[issue.path[0] as keyof SampleInput] = issue.message;
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    createMutation.mutate(parsed.data);
  }

  return (
    <ResponsiveModal open={open} onOpenChange={changeOpen}>
      <ResponsiveModalContent
        className="sm:max-w-[640px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>New Sample</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Record a manufacturer sample with a photo and basic specs.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <form onSubmit={submit} className="flex flex-col gap-6">
          {createMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {createMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
          <fieldset disabled={createMutation.isPending} className="min-w-0">
            <legend className="sr-only">Sample details</legend>
            <FieldGroup>
              <SamplePhoto
                value={form.imageUrl}
                onChange={(value) => setField("imageUrl", value)}
                onUploadingChange={setUploading}
                disabled={createMutation.isPending}
              />
              <SampleFormFields
                form={form}
                fieldErrors={fieldErrors}
                setField={setField}
                disabled={createMutation.isPending}
              />
            </FieldGroup>
          </fieldset>
          <ResponsiveModalFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {uploading
                ? "Uploading photo…"
                : createMutation.isPending
                  ? "Creating…"
                  : "Create Sample"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
