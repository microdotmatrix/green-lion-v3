import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ShoppingBag } from "lucide-react";
import { CartItem } from "./cart-item";
import type { CartItem as CartItemType } from "./types";

interface CartItemsListProps {
  items: CartItemType[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onBrowseProducts: () => void;
  error?: string;
}

function calculateEstimatedTotal(items: CartItemType[]): string {
  return items
    .reduce((sum, item) => {
      if (!item.price) return sum;
      return sum + parseFloat(item.price) * item.quantity;
    }, 0)
    .toFixed(2);
}

export function CartItemsList({
  items,
  onUpdateQuantity,
  onRemove,
  onBrowseProducts,
  error,
}: CartItemsListProps) {
  const isEmpty = items.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Products</CardTitle>
        <CardAction>
          <Button variant="default" size="sm" onClick={onBrowseProducts}>
            <Plus className="size-4" />
            Add more products
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="mb-4 size-10 text-muted-foreground/50" />
            <p className="mb-4 text-muted-foreground">No products added yet</p>
            <Button variant="outline" onClick={onBrowseProducts}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}

        {!isEmpty && (
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-between text-lg">
              <span>Estimated Total:</span>
              <span className="text-xl font-bold">
                ${calculateEstimatedTotal(items)}
              </span>
            </div>
            <p className="mt-2 text-[0.8125rem] text-muted-foreground">
              Final pricing will be confirmed in your quote
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
