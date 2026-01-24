import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FolderOpen,
  GripVertical,
  Package,
  Plus,
  Sliders,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

interface Attribute {
  id: string;
  name: string;
  attributeType: string;
  options: string[] | null;
}

interface CategoryAttribute {
  id: string;
  attributeId: string;
  displayOrder: number;
  activeOptions: string[] | null;
  attributeName: string;
  attributeType: string;
  allOptions: string[] | null;
}

async function fetchCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/admin/categories/${id}`);
  if (!response.ok) throw new Error("Failed to fetch category");
  return response.json();
}

async function fetchCategoryAttributes(
  categoryId: string,
): Promise<CategoryAttribute[]> {
  const response = await fetch(
    `/api/admin/categories/${categoryId}/attributes`,
  );
  if (!response.ok) throw new Error("Failed to fetch category attributes");
  return response.json();
}

async function fetchAllAttributes(): Promise<Attribute[]> {
  const response = await fetch("/api/admin/attributes");
  if (!response.ok) throw new Error("Failed to fetch attributes");
  return response.json();
}

async function assignAttribute(
  categoryId: string,
  attributeId: string,
): Promise<void> {
  const response = await fetch(
    `/api/admin/categories/${categoryId}/attributes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributeId }),
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assign attribute");
  }
}

async function removeAttribute(
  categoryId: string,
  attributeId: string,
): Promise<void> {
  const response = await fetch(
    `/api/admin/categories/${categoryId}/attributes`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributeId }),
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove attribute");
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "text":
      return "Text";
    case "number":
      return "Number";
    case "boolean":
      return "Yes/No";
    case "select":
      return "Single Select";
    case "multi_select":
      return "Multi Select";
    default:
      return type;
  }
}

function AddAttributeDialog({
  open,
  onOpenChange,
  categoryId,
  existingAttributeIds,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  existingAttributeIds: string[];
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedAttributeId, setSelectedAttributeId] =
    React.useState<string>("");

  const { data: allAttributes } = useQuery({
    queryKey: ["admin-attributes"],
    queryFn: fetchAllAttributes,
  });

  // Filter out already assigned attributes
  const availableAttributes = allAttributes?.filter(
    (attr) => !existingAttributeIds.includes(attr.id),
  );

  const assignMutation = useMutation({
    mutationFn: () => assignAttribute(categoryId, selectedAttributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-category-attributes", categoryId],
      });
      setSelectedAttributeId("");
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Attribute</DialogTitle>
          <DialogDescription>
            Assign an attribute to this category. Products in this category will
            inherit these customization options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {assignMutation.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {assignMutation.error.message}
            </div>
          )}

          <Select
            value={selectedAttributeId}
            onValueChange={setSelectedAttributeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an attribute..." />
            </SelectTrigger>
            <SelectContent>
              {availableAttributes?.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No available attributes
                </div>
              ) : (
                availableAttributes?.map((attr) => (
                  <SelectItem key={attr.id} value={attr.id}>
                    <div className="flex items-center gap-2">
                      <span>{attr.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(attr.attributeType)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedAttributeId || assignMutation.isPending}
          >
            {assignMutation.isPending ? "Adding..." : "Add Attribute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoryDetailPage({
  categoryId,
}: {
  categoryId: string;
}) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["admin-category", categoryId],
    queryFn: () => fetchCategory(categoryId),
  });

  const { data: attributes, isLoading: attributesLoading } = useQuery({
    queryKey: ["admin-category-attributes", categoryId],
    queryFn: () => fetchCategoryAttributes(categoryId),
  });

  const removeMutation = useMutation({
    mutationFn: (attributeId: string) =>
      removeAttribute(categoryId, attributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-category-attributes", categoryId],
      });
    },
  });

  const isLoading = categoryLoading || attributesLoading;
  const existingAttributeIds = attributes?.map((a) => a.attributeId) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div className="flex-1">
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
        {/* Category Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Category Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                {category?.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Display Order</span>
                    <span>{category?.displayOrder}</span>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/admin/categories`}>
                    <Package className="h-4 w-4 mr-2" />
                    Back to Categories
                  </a>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attributes */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Assigned Attributes</CardTitle>
              <CardDescription>
                Attributes available for product customization in this category
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </CardHeader>
          <CardContent>
            {attributesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : attributes?.length === 0 ? (
              <div className="text-center py-8">
                <Sliders className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No attributes assigned
                </h3>
                <p className="text-muted-foreground mb-4">
                  Add attributes to enable product customization in this
                  category.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {attributes?.map((attr) => (
                  <div
                    key={attr.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <p className="font-medium">{attr.attributeName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(attr.attributeType)}
                        </Badge>
                        {attr.allOptions && attr.allOptions.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {attr.allOptions.length} options
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(attr.attributeId)}
                      disabled={removeMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Attribute Dialog */}
      <AddAttributeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categoryId={categoryId}
        existingAttributeIds={existingAttributeIds}
        onSuccess={() => {}}
      />
    </div>
  );
}
