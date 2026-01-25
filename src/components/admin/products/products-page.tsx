import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { DeleteProductDialog } from "./delete-product-dialog";
import { useCategories, useProductMutations, useProducts } from "./hooks";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductsFilters } from "./products-filters";
import { ProductsTable } from "./products-table";
import type { Product } from "./types";

export default function ProductsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
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
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categoriesData } = useCategories();

  const { data, isLoading, error } = useProducts({
    page,
    search: debouncedSearch,
    categoryId: categoryFilter === "all" ? "" : categoryFilter,
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
        onSearchChange={(value) => setSearch(value)}
        categoryFilter={categoryFilter}
        onCategoryChange={(value) => {
          setCategoryFilter(value);
          setPage(1);
        }}
        categories={categoriesData || []}
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
        categoryFilter={categoryFilter}
        page={page}
        onPageChange={setPage}
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
