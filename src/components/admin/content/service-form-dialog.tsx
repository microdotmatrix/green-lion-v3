import * as React from "react";

import { Badge } from "@/components/ui/badge";
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

import { useServiceMutations } from "./services-hooks";
import type { Service, ServiceFormData } from "./services-types";

type ServiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Service | null;
  onSuccess: () => void;
};

export function ServiceFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: ServiceFormDialogProps) {
  const isEditing = !!item;
  const { createMut, updateMut } = useServiceMutations();
  const [featureInput, setFeatureInput] = React.useState("");

  const [formData, setFormData] = React.useState<ServiceFormData>({
    title: "",
    description: "",
    features: [],
    iconName: "",
    imageUrl: "",
    googleFormUrl: "",
    displayOrder: 0,
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        features: item.features || [],
        iconName: item.iconName || "",
        imageUrl: item.imageUrl || "",
        googleFormUrl: item.googleFormUrl || "",
        displayOrder: item.displayOrder,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        features: [],
        iconName: "",
        imageUrl: "",
        googleFormUrl: "",
        displayOrder: 0,
      });
    }
    setFeatureInput("");
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
      // Error shown via mutation state
    }
  };

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !formData.features.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, trimmed],
      }));
      setFeatureInput("");
    }
  };

  const removeFeature = (feature: string) =>
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((x) => x !== feature),
    }));

  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent
        className="sm:max-w-[600px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{isEditing ? "Edit Service" : "Add Service"}</ResponsiveModalTitle>
          <ResponsiveModalDescription>Manage service details</ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
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
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={featureInput}
                onChange={(event) => setFeatureInput(event.target.value)}
                placeholder="Add feature"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addFeature}>
                Add
              </Button>
            </div>
            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="gap-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon Name</Label>
              <Input
                value={formData.iconName}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    iconName: event.target.value,
                  }))
                }
                placeholder="Package, Cpu, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.imageUrl}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    imageUrl: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Google Form URL</Label>
            <Input
              value={formData.googleFormUrl}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  googleFormUrl: event.target.value,
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
