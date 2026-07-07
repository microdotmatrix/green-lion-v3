import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useProductSearch } from "./hooks";
import type { ProductSearchResult } from "./types";

type ProductPickerProps = {
  selectedProductId: string;
  selectedLabel: string;
  onSelect: (product: ProductSearchResult) => void;
};

export function ProductPicker({
  selectedProductId,
  selectedLabel,
  onSelect,
}: ProductPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results, isLoading } = useProductSearch(debouncedSearch, open);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedProductId ? selectedLabel : "Select a product..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        {/* Server-side search — Command's built-in filtering is disabled */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or SKU..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Searching..." : "No products found."}
            </CommandEmpty>
            <CommandGroup>
              {results?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProductId === product.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
