import { Button } from "@/components/ui/button";
import { Minus, Package, Plus, Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "./types";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

function formatPrice(price: string | null): string | null {
  if (!price) return null;
  return parseFloat(price).toFixed(2);
}

function calculateLineTotal(item: CartItemType): string | null {
  if (!item.price) return null;
  return (parseFloat(item.price) * item.quantity).toFixed(2);
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const lineTotal = calculateLineTotal(item);
  const isMinQuantity = item.quantity <= item.minimumOrderQuantity;

  return (
    <div className="rounded-md bg-secondary p-4">
      <div className="flex items-start gap-3">
        {/* Product Image */}
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Package className="size-6 text-muted-foreground/30" />
          )}
        </div>

        {/* Product Details */}
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase text-primary">
            {item.sku}
          </span>
          <h4 className="text-[0.9375rem] font-semibold leading-tight">
            {item.name}
          </h4>
          {item.price && (
            <span className="text-[0.8125rem] text-muted-foreground">
              ${formatPrice(item.price)} / unit
            </span>
          )}
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(item.productId)}
          aria-label="Remove item"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQuantity(item.productId, -1)}
            disabled={isMinQuantity}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-12 text-center font-medium">
            {item.quantity.toLocaleString()}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQuantity(item.productId, 1)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        {/* Line Total */}
        <div className="ml-auto shrink-0 text-right font-semibold">
          {lineTotal ? (
            <span>${lineTotal}</span>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">
              Price on request
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
