import { Plus } from "lucide-react";
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

import { useSampleRequestMutations } from "./hooks";
import { SampleRequestItemRow } from "./sample-request-item-row";
import type { SampleRequestFormData, SampleRequestItemFormData } from "./types";

// Rows carry a stable client-only key so React state (e.g. an open product
// picker) stays attached to the right row when earlier rows are removed
type FormItem = SampleRequestItemFormData & { key: string };

type FormState = Omit<SampleRequestFormData, "items"> & { items: FormItem[] };

function makeEmptyItem(): FormItem {
  return {
    key: crypto.randomUUID(),
    productId: "",
    sku: "",
    productName: "",
    capacity: "",
    quantity: 1,
  };
}

function makeEmptyForm(): FormState {
  return {
    recipientName: "",
    companyName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    notes: "",
    items: [makeEmptyItem()],
  };
}

type SampleRequestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function SampleRequestFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: SampleRequestFormDialogProps) {
  const { createMut } = useSampleRequestMutations();
  const [formData, setFormData] = React.useState<FormState>(makeEmptyForm);

  React.useEffect(() => {
    if (open) {
      setFormData(makeEmptyForm());
      createMut.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateField = (
    field: keyof Omit<FormState, "items">,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (key: string, item: SampleRequestItemFormData) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((existing) =>
        existing.key === key ? { ...item, key } : existing,
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, makeEmptyItem()],
    }));
  };

  const removeItem = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.key !== key),
    }));
  };

  const hasValidItems =
    formData.items.length > 0 &&
    formData.items.every((item) => item.productId && item.quantity >= 1);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasValidItems) return;
    try {
      await createMut.mutateAsync(formData);
      onOpenChange(false);
      onSuccess();
    } catch {
      // Error shown via mutation state
    }
  };

  const isLoading = createMut.isPending;
  const error = createMut.error;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent
        className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>New Sample Request</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Choose products and quantities, then print labels for the sample
            bags.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error instanceof Error ? error.message : "Something went wrong"}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Products</h3>
            {formData.items.map((item) => (
              <SampleRequestItemRow
                key={item.key}
                item={item}
                canRemove={formData.items.length > 1}
                onChange={(updated) => updateItem(item.key, updated)}
                onRemove={() => removeItem(item.key)}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Recipient</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Name *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(event) =>
                    updateField("recipientName", event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(event) =>
                    updateField("companyName", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Shipping Address</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addressLine1">Address *</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(event) =>
                    updateField("addressLine1", event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2}
                  onChange={(event) =>
                    updateField("addressLine2", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(event) => updateField("state", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              rows={2}
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
            <Button type="submit" disabled={isLoading || !hasValidItems}>
              {isLoading ? "Creating..." : "Create Request"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
