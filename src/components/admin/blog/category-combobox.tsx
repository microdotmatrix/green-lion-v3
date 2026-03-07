import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BlogCategory } from "./types";

interface CategoryComboboxProps {
  value: string | undefined;
  onChange: (id: string) => void;
  categories: BlogCategory[];
  onCreateCategory: (name: string) => Promise<BlogCategory>;
  disabled?: boolean;
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  onCreateCategory,
  disabled,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const selectedCategory = categories.find((c) => c.id === value);

  const handleCreate = async () => {
    if (!search.trim()) return;
    setCreating(true);
    try {
      const newCat = await onCreateCategory(search.trim());
      onChange(newCat.id);
      setOpen(false);
      setSearch("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedCategory ? selectedCategory.name : "Select category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search categories..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Creating..." : `Create "${search}"`}
                </button>
              ) : (
                "No categories found."
              )}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="no-category"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                No category
              </CommandItem>
              {categories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.name}
                  onSelect={() => {
                    onChange(cat.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cat.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {cat.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {search.trim() && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value={`create-${search}`}
                    onSelect={handleCreate}
                    disabled={creating}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {creating ? "Creating..." : `+ Create "${search}"`}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
