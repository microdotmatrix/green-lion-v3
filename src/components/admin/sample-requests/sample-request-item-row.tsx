import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useProductCapacityOptions } from "./hooks";
import { ProductPicker } from "./product-picker";
import type { ProductSearchResult, SampleRequestItemFormData } from "./types";

type SampleRequestItemRowProps = {
  item: SampleRequestItemFormData;
  canRemove: boolean;
  onChange: (item: SampleRequestItemFormData) => void;
  onRemove: () => void;
};

export function SampleRequestItemRow({
  item,
  canRemove,
  onChange,
  onRemove,
}: SampleRequestItemRowProps) {
  const { data: capacityOptions } = useProductCapacityOptions(
    item.productId || null,
  );

  // Products expose capacity through the attribute system; when the selected
  // product has a "Capacity" attribute with options, offer them as a dropdown,
  // otherwise fall back to free text so the form never blocks
  const hasCapacityOptions = !!capacityOptions && capacityOptions.length > 0;

  const handleProductSelect = (product: ProductSearchResult) => {
    onChange({
      ...item,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      capacity: "",
    });
  };

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <ProductPicker
            selectedProductId={item.productId}
            selectedLabel={
              item.productId ? `${item.productName} (${item.sku})` : ""
            }
            onSelect={handleProductSelect}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-destructive hover:text-destructive"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove item</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          {hasCapacityOptions ? (
            <Select
              value={item.capacity}
              onValueChange={(value) => onChange({ ...item, capacity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Capacity" />
              </SelectTrigger>
              <SelectContent>
                {capacityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={item.capacity}
              onChange={(event) =>
                onChange({ ...item, capacity: event.target.value })
              }
              placeholder="Capacity (optional)"
              disabled={!item.productId}
            />
          )}
        </div>
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(event) =>
            onChange({
              ...item,
              quantity: Math.max(1, parseInt(event.target.value) || 1),
            })
          }
          placeholder="Qty"
          disabled={!item.productId}
        />
      </div>
    </div>
  );
}
