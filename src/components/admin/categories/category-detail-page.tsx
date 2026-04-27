import { ArrowLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AddAttributeDialog } from "./add-attribute-dialog";
import { CategoryAttributesCard } from "./category-attributes-card";
import { CategoryInfoCard } from "./category-info-card";
import {
  useCategoryAttributeMutations,
  useCategoryAttributes,
  useCategoryDetail,
} from "./hooks";

export default function CategoryDetailPage({
  categoryId,
}: {
  categoryId: string;
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const { data: category, isLoading: categoryLoading } =
    useCategoryDetail(categoryId);
  const { data: attributes, isLoading: attributesLoading } =
    useCategoryAttributes(categoryId);
  const { removeMut } = useCategoryAttributeMutations(categoryId);

  const existingAttributeIds = attributes?.map((a) => a.attributeId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <a href="/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div className="min-w-0 flex-1">
          {categoryLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <>
              <h1 className="text-2xl font-bold">{category?.name}</h1>
              {category?.description && (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <CategoryInfoCard category={category} isLoading={categoryLoading} />
        <CategoryAttributesCard
          attributes={attributes}
          isLoading={attributesLoading}
          onAdd={() => setIsAddDialogOpen(true)}
          onRemove={(attributeId) => removeMut.mutate(attributeId)}
          isRemoving={removeMut.isPending}
        />
      </div>

      <AddAttributeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categoryId={categoryId}
        existingAttributeIds={existingAttributeIds}
      />
    </div>
  );
}
