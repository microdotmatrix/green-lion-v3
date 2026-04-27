import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CategoriesTable } from "./categories-table";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { useCategories, useCategoryMutations } from "./hooks";
import type { Category } from "./types";

export default function CategoriesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] =
    React.useState<Category | null>(null);

  const { data: categories, isLoading, error } = useCategories();
  const { deleteMut } = useCategoryMutations();

  const handleFormSuccess = () => {
    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, {
      onSuccess: () => setDeletingCategory(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories and organization
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load categories. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      <CategoriesTable
        categories={categories}
        isLoading={isLoading}
        onAdd={() => {
          setEditingCategory(null);
          setIsFormOpen(true);
        }}
        onEdit={(category) => {
          setEditingCategory(category);
          setIsFormOpen(true);
        }}
        onDelete={(category) => setDeletingCategory(category)}
      />

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
        onSuccess={handleFormSuccess}
      />

      <DeleteCategoryDialog
        category={deletingCategory}
        isDeleting={deleteMut.isPending}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
