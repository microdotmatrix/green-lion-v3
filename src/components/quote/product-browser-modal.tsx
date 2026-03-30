import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Check, Package, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import type { CartItem, Category, Product } from "./types";

interface ProductBrowserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  categories: Category[];
  cartItems: CartItem[];
  onAddProduct: (product: Product) => void;
}

interface ProductCardProps {
  product: Product;
  isInCart: boolean;
  onAdd: () => void;
}

function ProductCard({ product, isInCart, onAdd }: ProductCardProps) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Package className="size-5 text-muted-foreground/30" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[0.6875rem] font-semibold uppercase text-primary">
            {product.sku}
          </span>
          <h4 className="line-clamp-2 text-sm font-semibold">{product.name}</h4>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {product.price && (
              <span>From ${parseFloat(product.price).toFixed(2)}</span>
            )}
            <span>MOQ: {product.minimumOrderQuantity.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        variant={isInCart ? "secondary" : "default"}
        onClick={onAdd}
        className="mt-3 w-full sm:mt-0 sm:ml-auto sm:w-auto"
      >
        {isInCart ? (
          <>
            <Check className="size-3.5" />
            Added
          </>
        ) : (
          <>
            <Plus className="size-3.5" />
            Add
          </>
        )}
      </Button>
    </div>
  );
}

interface CategoryTabsProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-md border px-4 py-2 text-[0.8125rem] transition-colors",
            !selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary",
          )}
          onClick={() => onSelect(null)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={cn(
              "shrink-0 rounded-md border px-4 py-2 text-[0.8125rem] transition-colors",
              selected === cat.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary",
            )}
            onClick={() => onSelect(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface ProductBrowserContentProps {
  products: Product[];
  categories: Category[];
  cartItems: CartItem[];
  onAddProduct: (product: Product) => void;
}

function ProductBrowserContent({
  products,
  categories,
  cartItems,
  onAddProduct,
}: ProductBrowserContentProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isInCart = (productId: string) =>
    cartItems.some((item) => item.productId === productId);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-10"
        />
        {search && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch("")}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Results */}
      <ScrollArea className="h-[50vh] max-h-[500px]">
        {filteredProducts.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <p>No products found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pr-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isInCart={isInCart(product.id)}
                onAdd={() => onAddProduct(product)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function ProductBrowserModal({
  isOpen,
  onOpenChange,
  products,
  categories,
  cartItems,
  onAddProduct,
}: ProductBrowserModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-3xl">Browse Products</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <ProductBrowserContent
              products={products}
              categories={categories}
              cartItems={cartItems}
              onAddProduct={onAddProduct}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Browse Products</DialogTitle>
        </DialogHeader>
        <ProductBrowserContent
          products={products}
          categories={categories}
          cartItems={cartItems}
          onAddProduct={onAddProduct}
        />
      </DialogContent>
    </Dialog>
  );
}
