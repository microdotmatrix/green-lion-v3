import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sampleStatuses,
  sampleStatusLabels,
  type InboundSample,
  type SampleInput,
  type SampleStatus,
} from "@/lib/inbound-samples";

export function sampleFields(sample?: InboundSample): SampleInput {
  return {
    manufacturer: sample?.manufacturer ?? "",
    partNumber: sample?.partNumber ?? "",
    imageUrl: sample?.imageUrl ?? "",
    capacity: sample?.capacity ?? "",
    voltage: sample?.voltage ?? "",
    notes: sample?.notes ?? "",
    testingNotes: sample?.testingNotes ?? "",
    status: sample?.status ?? "received",
  };
}

export function SampleFormFields({
  form,
  fieldErrors,
  setField,
  disabled,
}: {
  form: SampleInput;
  fieldErrors: Partial<Record<keyof SampleInput, string>>;
  setField: <K extends keyof SampleInput>(
    key: K,
    value: SampleInput[K],
  ) => void;
  disabled: boolean;
}) {
  return (
    <>
      <FieldSet>
        <FieldLegend>Manufacturer & specifications</FieldLegend>
        <FieldDescription>
          Only manufacturer and part number are required.
        </FieldDescription>
        <FieldGroup>
          <Field data-invalid={!!fieldErrors.manufacturer}>
            <FieldLabel htmlFor="manufacturer">Manufacturer *</FieldLabel>
            <Input
              id="manufacturer"
              value={form.manufacturer}
              required
              maxLength={200}
              aria-invalid={!!fieldErrors.manufacturer}
              aria-describedby={
                fieldErrors.manufacturer ? "manufacturer-error" : undefined
              }
              onChange={(event) => setField("manufacturer", event.target.value)}
            />
            <FieldError id="manufacturer-error">
              {fieldErrors.manufacturer}
            </FieldError>
          </Field>
          <Field data-invalid={!!fieldErrors.partNumber}>
            <FieldLabel htmlFor="part-number">Part number *</FieldLabel>
            <Input
              id="part-number"
              value={form.partNumber}
              required
              maxLength={200}
              aria-invalid={!!fieldErrors.partNumber}
              aria-describedby={
                fieldErrors.partNumber ? "part-number-error" : undefined
              }
              onChange={(event) => setField("partNumber", event.target.value)}
            />
            <FieldError id="part-number-error">
              {fieldErrors.partNumber}
            </FieldError>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
              <Input
                id="capacity"
                placeholder="e.g. 5,000 mAh"
                value={form.capacity}
                maxLength={200}
                onChange={(event) => setField("capacity", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="voltage">Voltage</FieldLabel>
              <Input
                id="voltage"
                placeholder="e.g. 3.7 V"
                value={form.voltage}
                maxLength={200}
                onChange={(event) => setField("voltage", event.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="sample-notes">
              Additional notes / specifications
            </FieldLabel>
            <Textarea
              id="sample-notes"
              rows={4}
              value={form.notes}
              maxLength={10000}
              placeholder="Device type, dimensions, manufacturer claims, or anything worth checking."
              onChange={(event) => setField("notes", event.target.value)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Evaluation</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="testing-status">Testing status</FieldLabel>
            <Select
              value={form.status}
              disabled={disabled}
              onValueChange={(value) =>
                setField("status", value as SampleStatus)
              }
            >
              <SelectTrigger id="testing-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sampleStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {sampleStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Mark Evaluated when testing is complete, then record the final
              decision on the sample details page.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="testing-notes">
              Testing notes / results
            </FieldLabel>
            <Textarea
              id="testing-notes"
              rows={4}
              value={form.testingNotes}
              maxLength={10000}
              placeholder="Tests performed, measured results, issues, and recommendation."
              onChange={(event) => setField("testingNotes", event.target.value)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>
    </>
  );
}
