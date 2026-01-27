import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useAttributes } from "@/components/admin/attributes/hooks";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { DeleteProductDialog } from "./delete-product-dialog";
import { useCategories, useProductMutations, useProducts } from "./hooks";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductsFilters } from "./products-filters";
import { ProductsTable } from "./products-table";
import type { Product, ProductSortBy, ProductSortDir } from "./types";

const DEFAULT_PAGE = 1;
const DEFAULT_SORT_BY: ProductSortBy = "createdAt";
const DEFAULT_SORT_DIR: ProductSortDir = "desc";
const SORT_BY_VALUES = new Set<ProductSortBy>([
  "createdAt",
  "title",
  "sku",
  "category",
  "price",
]);

type ProductFilters = {
  page: number;
  search: string;
  categoryId: string;
  attributeId: string;
  sortBy: ProductSortBy;
  sortDir: ProductSortDir;
};

const PRODUCT_FILTER_SCHEMA = {
  page: {
    param: "page",
    default: DEFAULT_PAGE,
    parse: (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
    },
    serialize: (value: number) => (value > DEFAULT_PAGE ? String(value) : null),
  },
  search: { param: "search", default: "" },
  categoryId: { param: "categoryId", default: "all" },
  attributeId: { param: "attributeId", default: "all" },
  sortBy: {
    param: "sortBy",
    default: DEFAULT_SORT_BY,
    parse: (value: string) =>
      SORT_BY_VALUES.has(value as ProductSortBy)
        ? (value as ProductSortBy)
        : DEFAULT_SORT_BY,
  },
  sortDir: {
    param: "sortDir",
    default: DEFAULT_SORT_DIR,
    parse: (value: string) => (value === "asc" ? "asc" : DEFAULT_SORT_DIR),
  },
} as const;

export default function ProductsPage() {
  const { filters, setFilters, resetFilters } =
    useUrlFilters<ProductFilters>(PRODUCT_FILTER_SCHEMA);
  const { page, search, categoryId, attributeId, sortBy, sortDir } = filters;
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(
    null,
  );
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(
    null,
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categoriesData } = useCategories();
  const { data: attributesData } = useAttributes();

  const { data, isLoading, error } = useProducts({
    page,
    search: debouncedSearch,
    categoryId: categoryId === "all" ? "" : categoryId,
    attributeId: attributeId === "all" ? "" : attributeId,
    sortBy,
    sortDir,
  });

  const { deleteProductMut, duplicateProductMut } = useProductMutations();

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setIsFormOpen(true);
  };

  const handleDuplicate = (id: string) => {
    duplicateProductMut.mutate(id);
  };

  const handleFormSuccess = () => {
    setEditingProductId(null);
  };

  const handleDelete = (productId: string) => {
    deleteProductMut.mutate(productId, {
      onSuccess: () => setDeletingProduct(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button
          onClick={() => {
            setEditingProductId(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <ProductsFilters
        search={search}
        onSearchChange={(value) => {
          setFilters((prev) => ({
            ...prev,
            search: value,
            page: DEFAULT_PAGE,
          }));
        }}
        categoryFilter={categoryId}
        onCategoryChange={(value) => {
          setFilters((prev) => ({
            ...prev,
            categoryId: value,
            page: DEFAULT_PAGE,
          }));
        }}
        attributeFilter={attributeId}
        onAttributeChange={(value) => {
          setFilters((prev) => ({
            ...prev,
            attributeId: value,
            page: DEFAULT_PAGE,
          }));
        }}
        sortBy={sortBy}
        onSortByChange={(value) => {
          setFilters((prev) => ({
            ...prev,
            sortBy: value,
            page: DEFAULT_PAGE,
          }));
        }}
        sortDir={sortDir}
        onSortDirChange={(value) => {
          setFilters((prev) => ({
            ...prev,
            sortDir: value,
            page: DEFAULT_PAGE,
          }));
        }}
        onReset={() => {
          resetFilters();
          setDebouncedSearch("");
        }}
        categories={categoriesData || []}
        attributes={attributesData || []}
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load products. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      <ProductsTable
        data={data}
        isLoading={isLoading}
        debouncedSearch={debouncedSearch}
        categoryFilter={categoryId}
        attributeFilter={attributeId}
        page={page}
        onPageChange={(nextPage) =>
          setFilters((prev) => ({ ...prev, page: nextPage }))
        }
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={(product) => setDeletingProduct(product)}
      />

      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        productId={editingProductId}
        categories={categoriesData || []}
        onSuccess={handleFormSuccess}
      />

      <DeleteProductDialog
        product={deletingProduct}
        isDeleting={deleteProductMut.isPending}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
