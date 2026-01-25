import { Plus, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { useProductDetail, useProductMutations } from "./hooks";
import type { Category, PricingTier, ProductFormData } from "./types";

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string | null;
  categories: Category[];
  onSuccess: () => void;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  productId,
  categories,
  onSuccess,
}: ProductFormDialogProps) {
  const isEditing = !!productId;
  const { createProductMut, updateProductMut } = useProductMutations();

  const [formData, setFormData] = React.useState<ProductFormData>({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    minimumOrderQuantity: 1,
    orderQuantityIncrement: 1,
    logoCost: "0",
    packagingCost: "0",
    images: [],
    pricingTiers: [{ minQuantity: 1, pricePerUnit: "0" }],
  });

  const { data: existingProduct, isLoading: isLoadingProduct } =
    useProductDetail(productId || "", !!productId && open);

  React.useEffect(() => {
    if (existingProduct) {
      setFormData({
        sku: existingProduct.sku,
        name: existingProduct.name,
        description: existingProduct.description,
        categoryId: existingProduct.categoryId || "",
        minimumOrderQuantity: existingProduct.minimumOrderQuantity,
        orderQuantityIncrement: existingProduct.orderQuantityIncrement,
        logoCost: existingProduct.logoCost,
        packagingCost: existingProduct.packagingCost,
        images: existingProduct.images || [],
        pricingTiers: existingProduct.pricingTiers?.length
          ? existingProduct.pricingTiers
          : [{ minQuantity: 1, pricePerUnit: "0" }],
      });
    } else if (!productId) {
      setFormData({
        sku: "",
        name: "",
        description: "",
        categoryId: "",
        minimumOrderQuantity: 1,
        orderQuantityIncrement: 1,
        logoCost: "0",
        packagingCost: "0",
        images: [],
        pricingTiers: [{ minQuantity: 1, pricePerUnit: "0" }],
      });
    }
  }, [existingProduct, productId, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dataToSubmit = {
      ...formData,
      categoryId: formData.categoryId || undefined,
    };

    try {
      if (isEditing && productId) {
        await updateProductMut.mutateAsync({ id: productId, data: dataToSubmit });
      } else {
        await createProductMut.mutateAsync(dataToSubmit as ProductFormData);
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      // Error shown in UI via mutation state
    }
  };

  const addPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: [
        ...prev.pricingTiers,
        { minQuantity: 1, pricePerUnit: "0" },
      ],
    }));
  };

  const removePricingTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== index),
    }));
  };

  const updatePricingTier = (
    index: number,
    field: keyof PricingTier,
    value: number | string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier,
      ),
    }));
  };

  const isLoading = createProductMut.isPending || updateProductMut.isPending;
  const error = createProductMut.error || updateProductMut.error;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent
        className="sm:max-w-[600px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{isEditing ? "Edit Product" : "Create Product"}</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {isEditing
              ? "Update product details."
              : "Add a new product to your catalog."}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {isLoadingProduct && isEditing ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error instanceof Error ? error.message : "Something went wrong"}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      sku: event.target.value,
                    }))
                  }
                  placeholder="PROD-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                placeholder="Product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Product description"
                rows={3}
                required
              />
            </div>

            <ImageUpload
              label="Product Image"
              value={formData.images[0] || ""}
              onChange={(url) =>
                setFormData((prev) => ({
                  ...prev,
                  images: url ? [url] : [],
                }))
              }
              description="Upload an image or paste a URL"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moq">Minimum Order Qty</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.minimumOrderQuantity}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      minimumOrderQuantity:
                        parseInt(event.target.value, 10) || 1,
                    }))
                  }
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="increment">Order Increment</Label>
                <Input
                  id="increment"
                  type="number"
                  value={formData.orderQuantityIncrement}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      orderQuantityIncrement:
                        parseInt(event.target.value, 10) || 1,
                    }))
                  }
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoCost">Logo Cost ($)</Label>
                <Input
                  id="logoCost"
                  type="number"
                  step="0.01"
                  value={formData.logoCost}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      logoCost: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagingCost">Packaging Cost ($)</Label>
                <Input
                  id="packagingCost"
                  type="number"
                  step="0.01"
                  value={formData.packagingCost}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      packagingCost: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pricing Tiers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPricingTier}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tier
                </Button>
              </div>
              <div className="space-y-2">
                {formData.pricingTiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Min Qty"
                        value={tier.minQuantity}
                        onChange={(event) =>
                          updatePricingTier(
                            index,
                            "minQuantity",
                            parseInt(event.target.value, 10) || 0,
                          )
                        }
                        min={1}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={tier.pricePerUnit}
                        onChange={(event) =>
                          updatePricingTier(
                            index,
                            "pricePerUnit",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    {formData.pricingTiers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePricingTier(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
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
        )}
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
