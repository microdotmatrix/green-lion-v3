import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useTradeshowRepMutations } from "./hooks";
import type { RepFormData, TradeshowRep } from "./types";
import { generateSlug } from "./utils";

type RepFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rep?: TradeshowRep | null;
  onSuccess: () => void;
};

export function RepFormDialog({
  open,
  onOpenChange,
  rep,
  onSuccess,
}: RepFormDialogProps) {
  const isEditing = !!rep;
  const { createRepMut, updateRepMut } = useTradeshowRepMutations();

  const [formData, setFormData] = React.useState<RepFormData>({
    name: "",
    email: "",
    phone: "",
    slug: "",
    company: "",
    active: true,
  });

  React.useEffect(() => {
    if (rep) {
      setFormData({
        name: rep.name,
        email: rep.email,
        phone: rep.phone,
        slug: rep.slug,
        company: rep.company,
        active: rep.active,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        slug: "",
        company: "",
        active: true,
      });
    }
  }, [rep, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (isEditing && rep) {
        await updateRepMut.mutateAsync({ id: rep.id, data: formData });
      } else {
        await createRepMut.mutateAsync(formData);
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      // Error handled via mutation state
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  const isLoading = createRepMut.isPending || updateRepMut.isPending;
  const error = createRepMut.error || updateRepMut.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Representative" : "Add Representative"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update rep details."
              : "Add a new trade show representative."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error instanceof Error ? error.message : "Something went wrong"}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    company: event.target.value,
                  }))
                }
                placeholder="Acme Corp"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                placeholder="+1 555-123-4567"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  slug: event.target.value,
                }))
              }
              placeholder="john-smith"
              required
            />
            <p className="text-xs text-muted-foreground">
              Public URL: /leads/{formData.slug || "slug"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, active: checked }))
              }
            />
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
