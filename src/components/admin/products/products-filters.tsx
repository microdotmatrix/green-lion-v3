import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Attribute } from "@/components/admin/attributes/types";
import type { Category, ProductSortBy, ProductSortDir } from "./types";

const SORT_BY_OPTIONS: { value: ProductSortBy; label: string }[] = [
  { value: "createdAt", label: "Date Added" },
  { value: "title", label: "Title" },
  { value: "sku", label: "SKU" },
  { value: "category", label: "Category" },
  { value: "price", label: "Price" },
];

const SORT_DIR_OPTIONS: { value: ProductSortDir; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

type ProductsFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  attributeFilter: string;
  onAttributeChange: (value: string) => void;
  sortBy: ProductSortBy;
  onSortByChange: (value: ProductSortBy) => void;
  sortDir: ProductSortDir;
  onSortDirChange: (value: ProductSortDir) => void;
  onReset: () => void;
  categories: Category[];
  attributes: Attribute[];
};

export function ProductsFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  attributeFilter,
  onAttributeChange,
  sortBy,
  onSortByChange,
  sortDir,
  onSortDirChange,
  onReset,
  categories,
  attributes,
}: ProductsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[240px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={categoryFilter}
        onValueChange={(value) => onCategoryChange(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={attributeFilter}
        onValueChange={(value) => onAttributeChange(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Attributes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Attributes</SelectItem>
          {attributes.map((attr) => (
            <SelectItem key={attr.id} value={attr.id}>
              {attr.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sortBy}
        onValueChange={(value) => onSortByChange(value as ProductSortBy)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          {SORT_BY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sortDir}
        onValueChange={(value) => onSortDirChange(value as ProductSortDir)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          {SORT_DIR_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
