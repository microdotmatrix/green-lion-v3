import { FolderOpen, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { Category } from "./types";

type CategoryInfoCardProps = {
  category: Category | undefined;
  isLoading: boolean;
};

export function CategoryInfoCard({
  category,
  isLoading,
}: CategoryInfoCardProps) {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Category Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
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
  );
}
