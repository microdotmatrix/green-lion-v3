import * as React from "react";

import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Textarea } from "@/components/ui/textarea";

import { useCaseStudyMutations } from "./case-studies-hooks";
import type { CaseStudy, CaseStudyFormData } from "./case-studies-types";

type CaseStudyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: CaseStudy | null;
  onSuccess: () => void;
};

export function CaseStudyFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: CaseStudyFormDialogProps) {
  const isEditing = !!item;
  const { createMut, updateMut } = useCaseStudyMutations();

  const [formData, setFormData] = React.useState<CaseStudyFormData>({
    productName: "",
    brandName: "",
    description: "",
    image: "",
    externalLink: "",
    displayOrder: 0,
  });
  const [imageError, setImageError] = React.useState("");

  React.useEffect(() => {
    if (item) {
      setFormData({
        productName: item.productName,
        brandName: item.brandName,
        description: item.description,
        image: item.image,
        externalLink: item.externalLink,
        displayOrder: item.displayOrder,
      });
    } else {
      setFormData({
        productName: "",
        brandName: "",
        description: "",
        image: "",
        externalLink: "",
        displayOrder: 0,
      });
    }
    setImageError("");
  }, [item]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.image.trim()) {
      setImageError("A case study image is required.");
      return;
    }

    try {
      if (isEditing && item) {
        await updateMut.mutateAsync({ id: item.id, data: formData });
      } else {
        await createMut.mutateAsync(formData);
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      // Error shown via mutation state
    }
  };

  const isLoading = createMut.isPending || updateMut.isPending;
  const error = createMut.error || updateMut.error;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {isEditing ? "Edit Case Study" : "Add Case Study"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Manage case study details
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error instanceof Error ? error.message : "Something went wrong"}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.productName}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    productName: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Brand Name *</Label>
              <Input
                value={formData.brandName}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    brandName: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <ImageUpload
              label="Case Study Image *"
              value={formData.image}
              onChange={(url) => {
                setFormData((prev) => ({ ...prev, image: url }));
                setImageError("");
              }}
              description="Upload an image or paste a URL"
            />
            {imageError ? (
              <p className="text-xs text-destructive">{imageError}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>External Link *</Label>
              <Input
                value={formData.externalLink}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    externalLink: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayOrder: parseInt(event.target.value, 10) || 0,
                  }))
                }
              />
            </div>
          </div>
          <ResponsiveModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
