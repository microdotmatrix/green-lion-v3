import * as React from "react";

import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useCategoryMutations } from "./hooks";
import type { Category, CategoryFormData } from "./types";

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess: () => void;
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const isEditing = !!category;
  const { createMut, updateMut } = useCategoryMutations();

  const [formData, setFormData] = React.useState<CategoryFormData>({
    name: "",
    description: "",
    imageUrl: "",
    displayOrder: 0,
  });

  React.useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        displayOrder: category.displayOrder,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        displayOrder: 0,
      });
    }
  }, [category, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (isEditing && category) {
        await updateMut.mutateAsync({ id: category.id, data: formData });
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
          <ResponsiveModalTitle>{isEditing ? "Edit Category" : "Create Category"}</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {isEditing
              ? "Update the category details below."
              : "Add a new category to organize your products."}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error instanceof Error ? error.message : "Something went wrong"}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Category name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Brief description of this category"
              rows={3}
            />
          </div>

          <ImageUpload
            label="Category Image"
            value={formData.imageUrl}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, imageUrl: url }))
            }
            categoryId={category?.id}
            description="Upload an image, paste a URL, or select from product images"
          />

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  displayOrder: parseInt(event.target.value, 10) || 0,
                }))
              }
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first
            </p>
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
