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

import { TeamBioEditor } from "./team-bio-editor";
import { useTeamMemberMutations } from "./team-members-hooks";
import type { TeamMember, TeamMemberFormData } from "./team-members-types";

type TeamMemberFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: TeamMember | null;
  onSuccess: () => void;
};

const emptyForm: TeamMemberFormData = {
  name: "",
  title: "",
  summaryHtml: "",
  photoUrl: "",
  displayOrder: 0,
};

export function TeamMemberFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: TeamMemberFormDialogProps) {
  const isEditing = !!item;
  const { createMut, updateMut } = useTeamMemberMutations();

  const [formData, setFormData] = React.useState<TeamMemberFormData>(emptyForm);
  const [photoError, setPhotoError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    if (item) {
      setFormData({
        name: item.name,
        title: item.title,
        summaryHtml: item.summaryHtml,
        photoUrl: item.photoUrl ?? "",
        displayOrder: item.displayOrder,
      });
    } else {
      setFormData(emptyForm);
    }

    setPhotoError("");
  }, [item, open]);

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
      // Error surfaced via mutation state
    }
  };

  const isLoading = createMut.isPending || updateMut.isPending;
  const error = createMut.error || updateMut.error;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent
        className="sm:max-w-[600px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {isEditing ? "Edit Team Member" : "Add Team Member"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Manage team member profile details
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error instanceof Error ? error.message : "Something went wrong"}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tm-name">Name *</Label>
              <Input
                id="tm-name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tm-title">Title *</Label>
              <Input
                id="tm-title"
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <ImageUpload
              label="Photo"
              value={formData.photoUrl}
              onChange={(url) => {
                setFormData((prev) => ({ ...prev, photoUrl: url }));
                setPhotoError("");
              }}
              description="Upload a headshot or paste a URL"
            />
            {photoError ? (
              <p className="text-xs text-destructive">{photoError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Bio Summary</Label>
            <TeamBioEditor
              value={formData.summaryHtml}
              onChange={(html) =>
                setFormData((prev) => ({ ...prev, summaryHtml: html }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Supports bold, italic, and linked text.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tm-order">Display Order</Label>
            <Input
              id="tm-order"
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
