import { useEffect, useState } from "react";

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
import { Switch } from "@/components/ui/switch";

import { useClientMutations } from "./clients-hooks";
import type { ClientFormData, ClientLogo } from "./clients-types";

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ClientLogo | null;
  onSuccess: () => void;
};

export function ClientFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: ClientFormDialogProps) {
  const isEditing = !!item;
  const { createMut, updateMut } = useClientMutations();

  const [formData, setFormData] = useState<ClientFormData>({
    companyName: "",
    logoUrl: "",
    externalLink: "",
    displayOrder: 0,
    featuredOnHomepage: true,
  });
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({
        companyName: item.companyName,
        logoUrl: item.logoUrl,
        externalLink: item.externalLink,
        displayOrder: item.displayOrder,
        featuredOnHomepage: item.featuredOnHomepage,
      });
    } else {
      setFormData({
        companyName: "",
        logoUrl: "",
        externalLink: "",
        displayOrder: 0,
        featuredOnHomepage: true,
      });
    }
    setLogoError("");
  }, [item]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.logoUrl.trim()) {
      setLogoError("A client logo is required.");
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

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {isEditing ? "Edit Client" : "Add Client"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Manage client logo details
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
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
            <ImageUpload
              label="Client Logo *"
              value={formData.logoUrl}
              onChange={(url) => {
                setFormData((prev) => ({ ...prev, logoUrl: url }));
                setLogoError("");
              }}
              description="Upload an image or paste a URL"
            />
            {logoError ? (
              <p className="text-xs text-destructive">{logoError}</p>
            ) : null}
          </div>
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
          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-center justify-between pt-6">
              <Label>Featured</Label>
              <Switch
                checked={formData.featuredOnHomepage}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    featuredOnHomepage: checked,
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
