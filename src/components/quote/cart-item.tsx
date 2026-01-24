import { Button } from "@/components/ui/button";
import { Minus, Package, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-4 rounded-md bg-secondary p-4 sm:grid-cols-[4rem_1fr_auto_auto_auto]">
      {/* Product Image */}
      <div className="flex size-16 items-center justify-center overflow-hidden rounded-sm bg-white">
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
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase text-primary">
          {item.sku}
        </span>
        <h4 className="text-[0.9375rem] font-semibold">{item.name}</h4>
        {item.price && (
          <span className="text-[0.8125rem] text-muted-foreground">
            ${formatPrice(item.price)} / unit
          </span>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="col-span-1 flex items-center gap-2 sm:col-span-1 sm:row-auto">
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
      <div className="col-start-2 row-start-2 min-w-20 text-left font-semibold sm:col-start-auto sm:row-start-auto sm:text-right">
        {lineTotal ? (
          <span>${lineTotal}</span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">
            Price on request
          </span>
        )}
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="row-start-1 size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:row-start-auto"
        onClick={() => onRemove(item.productId)}
        aria-label="Remove item"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
