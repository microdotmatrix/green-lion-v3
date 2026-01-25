import { GripVertical, Plus, Sliders, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { CategoryAttribute } from "./types";
import { getTypeLabel } from "./utils";

type CategoryAttributesCardProps = {
  attributes: CategoryAttribute[] | undefined;
  isLoading: boolean;
  onAdd: () => void;
  onRemove: (attributeId: string) => void;
  isRemoving: boolean;
};

export function CategoryAttributesCard({
  attributes,
  isLoading,
  onAdd,
  onRemove,
  isRemoving,
}: CategoryAttributesCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Assigned Attributes</CardTitle>
          <CardDescription>
            Attributes available for product customization in this category
          </CardDescription>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
              Add attributes to enable product customization in this category.
            </p>
            <Button onClick={onAdd}>
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
                  onClick={() => onRemove(attr.attributeId)}
                  disabled={isRemoving}
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
  );
}
