import * as React from "react";

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

import { useTestimonialMutations } from "./testimonials-hooks";
import type { Testimonial, TestimonialFormData } from "./testimonials-types";

type TestimonialFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Testimonial | null;
  onSuccess: () => void;
};

export function TestimonialFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: TestimonialFormDialogProps) {
  const isEditing = !!item;
  const { createMut, updateMut } = useTestimonialMutations();

  const [formData, setFormData] = React.useState<TestimonialFormData>({
    quote: "",
    author: "",
    authorTitle: "",
    companyName: "",
    companyLink: "",
    companyLogo: "",
    displayOrder: 0,
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        quote: item.quote,
        author: item.author,
        authorTitle: item.authorTitle || "",
        companyName: item.companyName,
        companyLink: item.companyLink || "",
        companyLogo: item.companyLogo || "",
        displayOrder: item.displayOrder,
      });
    } else {
      setFormData({
        quote: "",
        author: "",
        authorTitle: "",
        companyName: "",
        companyLink: "",
        companyLogo: "",
        displayOrder: 0,
      });
    }
  }, [item]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
            {isEditing ? "Edit Testimonial" : "Add Testimonial"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Manage testimonial details
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error instanceof Error ? error.message : "Something went wrong"}
            </div>
          )}
          <div className="space-y-2">
            <Label>Quote *</Label>
            <Textarea
              value={formData.quote}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  quote: event.target.value,
                }))
              }
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Author *</Label>
              <Input
                value={formData.author}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    author: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Author Title</Label>
              <Input
                value={formData.authorTitle}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    authorTitle: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Input
                value={formData.companyName}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    companyName: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Company Link</Label>
              <Input
                value={formData.companyLink}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    companyLink: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Logo URL</Label>
              <Input
                value={formData.companyLogo}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    companyLogo: event.target.value,
                  }))
                }
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
