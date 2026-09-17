import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUploadThing } from "@/lib/uploadthing";

export function SamplePhoto({
  value,
  onChange,
  onUploadingChange,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  disabled: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("imageUploader");
  return (
    <Field>
      <FieldLabel htmlFor="sample-photo">Device photo</FieldLabel>
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="w-fit"
          aria-label="Open device photo at full size"
        >
          <img
            src={value}
            alt="Inbound sample device"
            className="max-h-64 w-full rounded-md border object-contain"
          />
        </a>
      )}
      <Input
        id="sample-photo"
        type="file"
        accept="image/*"
        disabled={disabled || uploading}
        aria-describedby="sample-photo-help"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
            toast.error("Choose an image no larger than 4 MB.");
            return;
          }
          setUploading(true);
          onUploadingChange(true);
          try {
            const result = await startUpload([file]);
            if (!result?.[0]?.ufsUrl)
              throw new Error(
                "The photo could not be uploaded. Please try again.",
              );
            onChange(result[0].ufsUrl);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Photo upload failed. Please try again.",
            );
          } finally {
            setUploading(false);
            onUploadingChange(false);
          }
        }}
      />
      <FieldDescription id="sample-photo-help" aria-live="polite">
        {uploading
          ? "Uploading photo…"
          : "Optional. Upload one image, up to 4 MB."}
      </FieldDescription>
      {value && (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={disabled || uploading}
          onClick={() => onChange("")}
        >
          Remove photo
        </Button>
      )}
    </Field>
  );
}
