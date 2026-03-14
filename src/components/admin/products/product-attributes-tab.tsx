import { useState } from "react";
import { Plus, Settings2, Sliders } from "lucide-react";

import { useCategoryAttributes } from "@/components/admin/categories/hooks";
import { getTypeLabel } from "@/components/admin/categories/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AssignAttributeDialog } from "./assign-attribute-dialog";
import { ConfigureAttributeDialog } from "./configure-attribute-dialog";
import { useProductAttributes } from "./hooks";
import type { ProductAttribute } from "./types";

type ProductAttributesTabProps = {
  productId: string;
  categoryId: string;
};

export function ProductAttributesTab({
  productId,
  categoryId,
}: ProductAttributesTabProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [configuringAttribute, setConfiguringAttribute] =
    useState<ProductAttribute | null>(null);

  const {
    data: productAttributes,
    isLoading: productAttrsLoading,
  } = useProductAttributes(productId);

  const {
    data: categoryAttributes,
    isLoading: categoryAttrsLoading,
  } = useCategoryAttributes(categoryId);

  const isLoading = productAttrsLoading || categoryAttrsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Section 1 — From Category (read-only) */}
      {categoryId && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            From Category
          </h4>
          {!categoryAttributes || categoryAttributes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attributes on this category.
            </p>
          ) : (
            categoryAttributes.map((attr) => (
              <div
                key={attr.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{attr.attributeName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(attr.attributeType)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Section 2 — Product Attributes (editable) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Product Attributes</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAssignOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Attribute
          </Button>
        </div>

        {!productAttributes || productAttributes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <Sliders className="h-8 w-8" />
            <p className="text-sm">No attributes assigned</p>
          </div>
        ) : (
          productAttributes.map((attr) => (
            <div
              key={attr.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setConfiguringAttribute(attr)}
            >
              <div className="flex-1">
                <p className="font-medium">{attr.attributeName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(attr.attributeType)}
                  </Badge>
                  {attr.required && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {attr.additionalCost !== "0.00" &&
                    attr.additionalCost !== "0" && (
                      <span className="text-xs text-muted-foreground">
                        +${attr.additionalCost}
                      </span>
                    )}
                </div>
              </div>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </div>
          ))
        )}
      </div>

      {/* Sub-dialogs */}
      <AssignAttributeDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        productId={productId}
        existingProductAttributeIds={
          productAttributes?.map((a) => a.attributeId) ?? []
        }
        categoryAttributeIds={
          categoryAttributes?.map((a) => a.attributeId) ?? []
        }
      />
      {configuringAttribute && (
        <ConfigureAttributeDialog
          open={!!configuringAttribute}
          onOpenChange={(open) => {
            if (!open) setConfiguringAttribute(null);
          }}
          productId={productId}
          attribute={configuringAttribute}
        />
      )}
    </div>
  );
}
